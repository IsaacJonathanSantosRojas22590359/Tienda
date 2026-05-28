from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from database import get_connection
from auth import verificar_token
from typing import List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from datetime import datetime
import io

router = APIRouter(prefix='/api', tags=['Ventas'])

class DetalleInput(BaseModel):
    producto_id: int
    cantidad:    int

class VentaInput(BaseModel):
    usuario_id:  int
    metodo_pago: str = 'efectivo'
    detalles:    List[DetalleInput]

# ── Listar ventas ────────────────────────────────────────────
@router.get('/ventas/')
def listar_ventas(payload: dict = Depends(verificar_token)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT v.id, v.usuario_id AS usuario, u.nombre AS usuario_nombre,
               v.total, v.fecha, v.metodo_pago
        FROM ventas v
        INNER JOIN usuarios u ON v.usuario_id = u.id
        ORDER BY v.fecha DESC
    """)
    ventas = cursor.fetchall()
    for v in ventas:
        v['total'] = float(v['total'])
        v['fecha'] = str(v['fecha'])
        cursor.execute("""
            SELECT dv.id, dv.producto_id AS producto, p.nombre AS producto_nombre,
                   dv.cantidad, dv.precio_unitario, dv.subtotal
            FROM detalle_ventas dv
            INNER JOIN productos p ON dv.producto_id = p.id
            WHERE dv.venta_id = %s
        """, (v['id'],))
        detalles = cursor.fetchall()
        for d in detalles:
            d['precio_unitario'] = float(d['precio_unitario'])
            d['subtotal']        = float(d['subtotal'])
        v['detalles'] = detalles
    cursor.close(); conn.close()
    return {'count': len(ventas), 'results': ventas}

# ── Registrar venta ──────────────────────────────────────────
@router.post('/ventas/')
def registrar_venta(data: VentaInput, payload: dict = Depends(verificar_token)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    total = 0
    items = []

    for item in data.detalles:
        cursor.execute("""
            SELECT precio, stock FROM productos
            WHERE id = %s AND activo = TRUE
        """, (item.producto_id,))
        prod = cursor.fetchone()
        if not prod:
            raise HTTPException(status_code=400, detail=f'Producto {item.producto_id} no encontrado')
        if prod['stock'] < item.cantidad:
            raise HTTPException(status_code=400, detail=f'Stock insuficiente para producto {item.producto_id}')
        precio_u = float(prod['precio'])
        subtotal = precio_u * item.cantidad
        total   += subtotal
        items.append({**item.dict(), 'precio_unitario': precio_u, 'subtotal': subtotal})

    cursor.execute("""
        INSERT INTO ventas (usuario_id, total, metodo_pago, fecha)
        VALUES (%s, %s, %s, NOW())
    """, (data.usuario_id, total, data.metodo_pago))
    conn.commit()
    venta_id = cursor.lastrowid

    for item in items:
        cursor.execute("""
            INSERT INTO detalle_ventas
                (venta_id, producto_id, cantidad, precio_unitario, subtotal)
            VALUES (%s, %s, %s, %s, %s)
        """, (venta_id, item['producto_id'], item['cantidad'],
              item['precio_unitario'], item['subtotal']))
        cursor.execute("""
            UPDATE productos SET stock = stock - %s WHERE id = %s
        """, (item['cantidad'], item['producto_id']))
    conn.commit()

    cursor.execute("""
        SELECT v.id, v.usuario_id AS usuario, u.nombre AS usuario_nombre,
               v.total, v.fecha, v.metodo_pago
        FROM ventas v
        INNER JOIN usuarios u ON v.usuario_id = u.id
        WHERE v.id = %s
    """, (venta_id,))
    venta = cursor.fetchone()
    venta['total'] = float(venta['total'])
    venta['fecha'] = str(venta['fecha'])

    cursor.execute("""
        SELECT dv.id, dv.producto_id AS producto, p.nombre AS producto_nombre,
               dv.cantidad, dv.precio_unitario, dv.subtotal
        FROM detalle_ventas dv
        INNER JOIN productos p ON dv.producto_id = p.id
        WHERE dv.venta_id = %s
    """, (venta_id,))
    detalles = cursor.fetchall()
    for d in detalles:
        d['precio_unitario'] = float(d['precio_unitario'])
        d['subtotal']        = float(d['subtotal'])
    venta['detalles'] = detalles
    cursor.close(); conn.close()
    return venta

# ── Ver venta ────────────────────────────────────────────────
@router.get('/ventas/{venta_id}/')
def ver_venta(venta_id: int, payload: dict = Depends(verificar_token)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT v.id, v.usuario_id AS usuario, u.nombre AS usuario_nombre,
               v.total, v.fecha, v.metodo_pago
        FROM ventas v
        INNER JOIN usuarios u ON v.usuario_id = u.id
        WHERE v.id = %s
    """, (venta_id,))
    venta = cursor.fetchone()
    if not venta:
        raise HTTPException(status_code=404, detail='Venta no encontrada')
    venta['total'] = float(venta['total'])
    venta['fecha'] = str(venta['fecha'])
    cursor.execute("""
        SELECT dv.id, dv.producto_id AS producto, p.nombre AS producto_nombre,
               dv.cantidad, dv.precio_unitario, dv.subtotal
        FROM detalle_ventas dv
        INNER JOIN productos p ON dv.producto_id = p.id
        WHERE dv.venta_id = %s
    """, (venta_id,))
    detalles = cursor.fetchall()
    for d in detalles:
        d['precio_unitario'] = float(d['precio_unitario'])
        d['subtotal']        = float(d['subtotal'])
    venta['detalles'] = detalles
    cursor.close(); conn.close()
    return venta

# ── Ticket PDF ───────────────────────────────────────────────
@router.get('/ventas/{venta_id}/ticket/')
def ticket_pdf(venta_id: int, payload: dict = Depends(verificar_token)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT v.id, v.total, v.fecha, v.metodo_pago, u.nombre AS empleado
        FROM ventas v
        INNER JOIN usuarios u ON v.usuario_id = u.id
        WHERE v.id = %s
    """, (venta_id,))
    venta = cursor.fetchone()
    if not venta:
        raise HTTPException(status_code=404, detail='Venta no encontrada')
    cursor.execute("""
        SELECT p.nombre, dv.cantidad, dv.precio_unitario, dv.subtotal
        FROM detalle_ventas dv
        INNER JOIN productos p ON dv.producto_id = p.id
        WHERE dv.venta_id = %s
    """, (venta_id,))
    detalles = cursor.fetchall()
    cursor.close(); conn.close()

    from reportlab.lib.enums import TA_CENTER
    from reportlab.lib.styles import ParagraphStyle

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=(2.83*inch, 8*inch),
        topMargin=.2*inch,
        bottomMargin=0.2*inch,
        leftMargin=0.15*inch,
        rightMargin=0.15*inch,
    )
    styles = getSampleStyleSheet()
    story  = []

    color_principal = colors.HexColor('#1a1a1a')
    color_linea     = colors.HexColor('#333333')

    fecha_str        = str(venta['fecha'])[:16]
    empleado_mayus   = venta['empleado'].upper()
    metodo_pago_mayus = venta['metodo_pago'].upper()

    # Encabezado
    story.append(Paragraph(
        '<font size="12" face="Courier"><b>TIENDA EL MEZQUITE</b></font>',
        ParagraphStyle('CenteredTitle', alignment=TA_CENTER, fontName='Courier-Bold', fontSize=12)
    ))
    story.append(Spacer(1, 0.03*inch))
    story.append(Paragraph(
        '<font size="5" face="Courier">Sistema de gestión de tienda</font>',
        ParagraphStyle('CenteredSubtitle', alignment=TA_CENTER, fontName='Courier', fontSize=5)
    ))
    story.append(Spacer(1, 0.05*inch))
    story.append(Paragraph(
        '<font size="6" face="Courier">' + '·' * 47 + '</font>',
        styles['Normal']
    ))
    story.append(Spacer(1, 0.08*inch))

    # Datos del ticket
    info_data = [
        ['TICKET:', str(venta['id'])],
        ['FECHA:',  fecha_str],
        ['ATENDIÓ:', empleado_mayus],
        ['PAGO:',   metodo_pago_mayus],
    ]
    t_info = Table(info_data, colWidths=[0.8*inch, 1.7*inch])
    t_info.setStyle(TableStyle([
        ('FONTNAME',       (0,0), (-1,-1), 'Courier-Bold'),
        ('FONTSIZE',       (0,0), (-1,-1), 7),
        ('TEXTCOLOR',      (0,0), (-1,-1), color_principal),
        ('TOPPADDING',     (0,0), (-1,-1), 1),
        ('BOTTOMPADDING',  (0,0), (-1,-1), 1),
        ('LEFTPADDING',    (0,0), (-1,-1), 0),
        ('RIGHTPADDING',   (0,0), (-1,-1), 0),
    ]))
    story.append(t_info)
    story.append(Spacer(1, 0.08*inch))
    story.append(Paragraph(
        '<font size="6" face="Courier">' + '·' * 47 + '</font>',
        styles['Normal']
    ))
    story.append(Spacer(1, 0.08*inch))

    # Productos
    story.append(Paragraph(
        '<font size="9" face="Courier"><b>---------- PRODUCTOS ----------</b></font>',
        ParagraphStyle('CenteredProducts', alignment=TA_CENTER, fontName='Courier-Bold', fontSize=9)
    ))
    story.append(Spacer(1, 0.05*inch))

    prod_data = []
    for d in detalles:
        nombre   = d['nombre'][:20]
        cantidad = str(d['cantidad']).rjust(3)
        precio   = f"${float(d['precio_unitario']):,.2f}".rjust(8)
        subtotal = f"${float(d['subtotal']):,.2f}".rjust(8)
        prod_data.append([
            Paragraph(f'<font size="6" face="Courier">{nombre}</font>', styles['Normal']),
            Paragraph(f'<font size="6" face="Courier"></font>', styles['Normal']),
            Paragraph(f'<font size="6" face="Courier">{cantidad} x {precio}</font>', styles['Normal']),
            Paragraph(f'<font size="6" face="Courier">{subtotal}</font>', styles['Normal']),
        ])

    t_prod = Table(prod_data, colWidths=[1*inch, 0.15*inch, 0.7*inch, 0.5*inch])
    t_prod.setStyle(TableStyle([
        ('FONTNAME',      (0,0), (-1,-1), 'Courier'),
        ('TOPPADDING',    (0,0), (-1,-1), 1),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
        ('LEFTPADDING',   (0,0), (-1,-1), 0),
        ('RIGHTPADDING',  (0,0), (-1,-1), 0),
        ('ALIGN',         (2,0), (-1,-1), 'RIGHT'),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_prod)
    story.append(Spacer(1, 0.05*inch))
    story.append(Paragraph(
        '<font size="6" face="Courier">' + '·' * 47 + '</font>',
        styles['Normal']
    ))
    story.append(Spacer(1, 0.05*inch))

    # Total
    t_total = Table(
        [['TOTAL:', f"${float(venta['total']):,.2f}"]],
        colWidths=[0.8*inch, 1.7*inch]
    )
    t_total.setStyle(TableStyle([
        ('FONTNAME',      (0,0), (-1,-1), 'Courier-Bold'),
        ('FONTSIZE',      (0,0), (-1,-1), 10),
        ('TEXTCOLOR',     (0,0), (-1,-1), color_principal),
        ('ALIGN',         (0,0), (0,0),   'LEFT'),
        ('ALIGN',         (1,0), (1,0),   'RIGHT'),
        ('TOPPADDING',    (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING',   (0,0), (-1,-1), 0),
        ('RIGHTPADDING',  (0,0), (-1,-1), 0),
        ('LINEBELOW',     (0,0), (-1,0),  1, color_linea),
        ('LINEABOVE',     (0,0), (-1,0),  1, color_linea),
    ]))
    story.append(t_total)
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph(
        '<font size="6" face="Courier">' + '·' * 47 + '</font>',
        styles['Normal']
    ))
    story.append(Spacer(1, 0.08*inch))

    # Pie
    story.append(Paragraph(
        '<font size="8" face="Courier"><b>¡GRACIAS POR SU COMPRA!</b></font>',
        ParagraphStyle('CenteredThanks', alignment=TA_CENTER, fontName='Courier-Bold', fontSize=8)
    ))
    story.append(Spacer(1, 0.03*inch))
    story.append(Paragraph(
        '<font size="6" face="Courier">Conserve este ticket como comprobante.</font>',
        ParagraphStyle('CenteredMessage', alignment=TA_CENTER, fontName='Courier', fontSize=6)
    ))
    story.append(Spacer(1, 0.08*inch))
    story.append(Paragraph(
        f'<font size="7" face="Courier"><b>Atendió: {empleado_mayus}</b></font>',
        styles['Normal']
    ))
    story.append(Spacer(1, 0.03*inch))
    story.append(Paragraph(
        f'<font size="7" face="Courier"><b>Ticket: {venta["id"]}</b></font>',
        styles['Normal']
    ))
    story.append(Spacer(1, 0.05*inch))
    story.append(Paragraph(
        f'<font size="4" face="Courier">Generado: {datetime.now().strftime("%d/%m/%Y %H:%M")}</font>',
        styles['Normal']
    ))

    doc.build(story)
    buffer.seek(0)
    return StreamingResponse(buffer, media_type='application/pdf',
        headers={'Content-Disposition': f'attachment; filename="ticket_{venta_id}.pdf"'})