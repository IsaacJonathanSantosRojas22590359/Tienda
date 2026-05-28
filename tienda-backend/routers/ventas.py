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

    buffer = io.BytesIO()
    doc    = SimpleDocTemplate(buffer, pagesize=(3.15*inch, 8*inch),
                               topMargin=0.3*inch, bottomMargin=0.3*inch,
                               leftMargin=0.2*inch, rightMargin=0.2*inch)
    styles = getSampleStyleSheet()
    story  = []

    story.append(Paragraph('<b>TIENDA FAMILIAR</b>', styles['Title']))
    story.append(Spacer(1, 0.05*inch))
    story.append(Paragraph('Sistema de gestión de tienda', styles['Normal']))
    story.append(Spacer(1, 0.1*inch))
    story.append(Table([['─' * 32]], colWidths=[2.75*inch]))
    story.append(Spacer(1, 0.1*inch))

    fecha_str = str(venta['fecha'])[:16]
    info_data = [
        ['Ticket #:', str(venta['id'])],
        ['Fecha:',    fecha_str],
        ['Atendió:',  venta['empleado']],
        ['Método:',   venta['metodo_pago'].capitalize()],
    ]
    t_info = Table(info_data, colWidths=[1.1*inch, 1.65*inch])
    t_info.setStyle(TableStyle([
        ('FONTSIZE',      (0,0), (-1,-1), 8),
        ('FONTNAME',      (0,0), (0,-1),  'Helvetica-Bold'),
        ('TOPPADDING',    (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_info)
    story.append(Spacer(1, 0.1*inch))
    story.append(Table([['─' * 32]], colWidths=[2.75*inch]))
    story.append(Spacer(1, 0.08*inch))

    prod_data = [['Producto', 'Cant.', 'P.Unit', 'Sub']]
    for d in detalles:
        prod_data.append([
            d['nombre'][:18], str(d['cantidad']),
            f"${float(d['precio_unitario']):.2f}",
            f"${float(d['subtotal']):.2f}",
        ])
    t_prod = Table(prod_data, colWidths=[1.1*inch, 0.4*inch, 0.65*inch, 0.6*inch])
    t_prod.setStyle(TableStyle([
        ('FONTSIZE',       (0,0),  (-1,-1), 7),
        ('FONTNAME',       (0,0),  (-1,0),  'Helvetica-Bold'),
        ('BACKGROUND',     (0,0),  (-1,0),  colors.HexColor('#1e2a3a')),
        ('TEXTCOLOR',      (0,0),  (-1,0),  colors.white),
        ('ALIGN',          (1,0),  (-1,-1), 'CENTER'),
        ('ROWBACKGROUNDS', (0,1),  (-1,-1), [colors.HexColor('#f0f4ff'), colors.white]),
        ('GRID',           (0,0),  (-1,-1), 0.3, colors.HexColor('#e2e8f0')),
        ('TOPPADDING',     (0,0),  (-1,-1), 3),
        ('BOTTOMPADDING',  (0,0),  (-1,-1), 3),
    ]))
    story.append(t_prod)
    story.append(Spacer(1, 0.1*inch))
    story.append(Table([['─' * 32]], colWidths=[2.75*inch]))
    story.append(Spacer(1, 0.08*inch))

    t_total = Table([['TOTAL:', f"${float(venta['total']):.2f}"]], colWidths=[1.5*inch, 1.25*inch])
    t_total.setStyle(TableStyle([
        ('FONTSIZE',      (0,0), (-1,-1), 11),
        ('FONTNAME',      (0,0), (-1,-1), 'Helvetica-Bold'),
        ('ALIGN',         (1,0), (1,0),   'RIGHT'),
        ('TOPPADDING',    (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_total)
    story.append(Spacer(1, 0.15*inch))
    story.append(Table([['─' * 32]], colWidths=[2.75*inch]))
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph(
        '<font size=7>¡Gracias por su compra!<br/>'
        'Conserve este ticket como comprobante.</font>',
        styles['Normal']
    ))
    story.append(Paragraph(
        f'<font size=6>Generado: {datetime.now().strftime("%d/%m/%Y %H:%M")}</font>',
        styles['Normal']
    ))
    doc.build(story)
    buffer.seek(0)
    return StreamingResponse(buffer, media_type='application/pdf',
        headers={'Content-Disposition': f'attachment; filename="ticket_{venta_id}.pdf"'})