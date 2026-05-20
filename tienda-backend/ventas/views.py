from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import connection, transaction
from .models import Venta, DetalleVenta
from .serializers import VentaSerializer, VentaCrearSerializer
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from datetime import datetime

class VentaViewSet(viewsets.ModelViewSet):
    serializer_class   = VentaSerializer
    permission_classes = [IsAuthenticated]
    http_method_names  = ['get', 'post']

    def get_queryset(self):
        # Query: listar ventas con datos del empleado
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT v.id
                FROM ventas v
                INNER JOIN usuarios u ON v.usuario_id = u.id
                ORDER BY v.fecha DESC
            """)
            ids = [row[0] for row in cursor.fetchall()]
        return Venta.objects.filter(id__in=ids).select_related('usuario').prefetch_related('detalles__producto')

    @transaction.atomic
    def create(self, request):
        serializer = VentaCrearSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data       = serializer.validated_data
        detalles   = data['detalles']
        total      = 0

        # Calcular total y validar stock
        for item in detalles:
            with connection.cursor() as cursor:
                # Query: verificar stock disponible
                cursor.execute("""
                    SELECT precio, stock FROM productos
                    WHERE id = %s AND activo = TRUE
                """, [item['producto_id']])
                row = cursor.fetchone()

            if not row:
                return Response(
                    {'error': f'Producto {item["producto_id"]} no encontrado'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            precio, stock = row
            if stock < item['cantidad']:
                return Response(
                    {'error': f'Stock insuficiente para producto {item["producto_id"]}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            item['precio_unitario'] = float(precio)
            item['subtotal']        = float(precio) * item['cantidad']
            total                  += item['subtotal']

        # Query: insertar venta
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO ventas (usuario_id, total, metodo_pago, fecha)
                VALUES (%s, %s, %s, NOW())
            """, [data['usuario_id'], total, data['metodo_pago']])
            venta_id = cursor.lastrowid

        # Query: insertar detalles y descontar stock
        for item in detalles:
            with connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO detalle_ventas
                        (venta_id, producto_id, cantidad, precio_unitario, subtotal)
                    VALUES (%s, %s, %s, %s, %s)
                """, [
                    venta_id, item['producto_id'],
                    item['cantidad'], item['precio_unitario'], item['subtotal']
                ])
                # Query: descontar stock automáticamente
                cursor.execute("""
                    UPDATE productos
                    SET stock = stock - %s
                    WHERE id = %s
                """, [item['cantidad'], item['producto_id']])

        venta = Venta.objects.get(id=venta_id)
        return Response(VentaSerializer(venta).data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ticket_pdf(request, venta_id):

    # Query: obtener datos de la venta
    with connection.cursor() as cursor:
        cursor.execute(""" 
            SELECT v.id, v.total, v.fecha, v.metodo_pago,
            u.nombre AS empleado
            FROM ventas v
            INNER JOIN usuarios u ON v.usuario_id = u.id
            WHERE v.id = %s
        """, [venta_id])
        venta = cursor.fetchone()

    if not venta:
        from rest_framework.response import Response
        from rest_framework import status
        return Response(
            {'error': 'Venta no encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Query: obtener detalle de la venta
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT p.nombre, dv.cantidad,
                dv.precio_unitario, dv.subtotal
            FROM detalle_ventas dv
            INNER JOIN productos p ON dv.producto_id = p.id
            WHERE dv.venta_id = %s
        """, [venta_id])
        detalles = cursor.fetchall()

    venta_id_db, total, fecha, metodo_pago, empleado = venta

    # Crear PDF
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="ticket_{venta_id_db}.pdf"'

    doc    = SimpleDocTemplate(
        response,
        pagesize=(2.83*inch, 8*inch),
        topMargin=.2*inch,
        bottomMargin=0.2*inch,
        leftMargin=0.15*inch,
        rightMargin=0.15*inch,
    )
    styles = getSampleStyleSheet()
    story  = []

    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    from reportlab.lib.styles import ParagraphStyle

    color_principal = colors.HexColor('#1a1a1a')
    color_linea = colors.HexColor('#333333')

    fecha_str = fecha.strftime('%d/%m/%Y %H:%M') if hasattr(fecha, 'strftime') else str(fecha)[:16]
    empleado_mayus = empleado.upper() if empleado else ''
    metodo_pago_mayus = metodo_pago.upper() if metodo_pago else ''

    # ── Encabezado ───────────────────────────────────────────
    story.append(Paragraph(
        f'<font size="12" face="Courier"><b>TIENDA EL MEZQUITE</b></font>',
        ParagraphStyle('CenteredTitle', alignment=TA_CENTER, fontName='Courier-Bold', fontSize=12)
    ))
    story.append(Spacer(1, 0.03*inch))
    story.append(Paragraph(
        f'<font size="5" face="Courier">Sistema de gestión de tienda</font>',
        ParagraphStyle('CenteredSubtitle', alignment=TA_CENTER, fontName='Courier', fontSize=5)
    ))
    story.append(Spacer(1, 0.05*inch))

    # Línea punteada decorativa
    story.append(Paragraph(
        '<font size="6" face="Courier">' + '·' * 47 + '</font>',
        styles['Normal']
    ))
    story.append(Spacer(1, 0.08*inch))

    # ── Datos del ticket ─────────────────────────────────────
    info_data = [
        ['TICKET:', str(venta_id_db)],
        ['FECHA:', fecha_str],
        ['ATENDIÓ:', empleado_mayus],
        ['PAGO:', metodo_pago_mayus],
    ]
    t_info = Table(info_data, colWidths=[0.8*inch, 1.7*inch])
    t_info.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Courier-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 7),
        ('TEXTCOLOR', (0,0), (-1,-1), color_principal),
        ('TOPPADDING', (0,0), (-1,-1), 1),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_info)
    story.append(Spacer(1, 0.08*inch))

    # Línea punteada
    story.append(Paragraph(
        '<font size="6" face="Courier">' + '·' * 47 + '</font>',
        styles['Normal']
    ))
    story.append(Spacer(1, 0.08*inch))

    # ── Productos ────────────────────────────────────────────
    story.append(Paragraph(
        f'<font size="9" face="Courier"><b>---------- PRODUCTOS ----------</b></font>',
        ParagraphStyle('CenteredProducts', alignment=TA_CENTER, fontName='Courier-Bold', fontSize=9)
    ))
    story.append(Spacer(1, 0.05*inch))

    prod_data = []
    for d in detalles:
        nombre = d[0][:20]
        cantidad = str(d[1]).rjust(3)
        precio = f'${float(d[2]):,.2f}'.rjust(8)
        subtotal = f'${float(d[3]):,.2f}'.rjust(8)
        
        prod_data.append([
            Paragraph(
                f'<font size="6" face="Courier">{nombre}</font>',
                styles['Normal']
            ),
            Paragraph(
                f'<font size="6" face="Courier"></font>',
                styles['Normal']
            ),
            Paragraph(
                f'<font size="6" face="Courier">{cantidad} x {precio}</font>',
                styles['Normal']
            ),
            Paragraph(
                f'<font size="6" face="Courier">{subtotal}</font>',
                styles['Normal']
            ),
        ])

    t_prod = Table(
        prod_data,
        colWidths=[1*inch,0.15*inch, 0.7*inch, 0.5*inch]
    )
    t_prod.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Courier'),
        ('TOPPADDING', (0,0), (-1,-1), 1),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('ALIGN', (2,0), (-1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_prod)
    story.append(Spacer(1, 0.05*inch))

    # Línea punteada
    story.append(Paragraph(
        '<font size="6" face="Courier">' + '·' * 47 + '</font>',
        styles['Normal']
    ))
    story.append(Spacer(1, 0.05*inch))

    # ── Total ────────────────────────────────────────────────
    total_formateado = f'${float(total):,.2f}'
    total_data = [
        ['TOTAL:', total_formateado]
    ]
    t_total = Table(total_data, colWidths=[0.8*inch, 1.7*inch])
    t_total.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Courier-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('TEXTCOLOR', (0,0), (-1,-1), color_principal),
        ('ALIGN', (0,0), (0,0), 'LEFT'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('LINEBELOW', (0,0), (-1,0), 1, color_linea),
        ('LINEABOVE', (0,0), (-1,0), 1, color_linea),
    ]))
    story.append(t_total)
    story.append(Spacer(1, 0.1*inch))

    # Línea punteada
    story.append(Paragraph(
        '<font size="6" face="Courier">' + '·' * 47 + '</font>',
        styles['Normal']
    ))
    story.append(Spacer(1, 0.08*inch))

    # ── Pie del ticket ───────────────────────────────────────
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

    # Información adicional
    story.append(Paragraph(
        '<font size="7" face="Courier"><b>Atendió: ' + empleado_mayus + '</b></font>',
        styles['Normal']
    ))
    story.append(Spacer(1, 0.03*inch))
    story.append(Paragraph(
        '<font size="7" face="Courier"><b>Ticket: ' + str(venta_id_db) + '</b></font>',
        styles['Normal']
    ))
    story.append(Spacer(1, 0.05*inch))

    story.append(Paragraph(
        '<font size="4" face="Courier">Generado: ' + datetime.now().strftime("%d/%m/%Y %H:%M") + '</font>',
        styles['Normal']
    ))

    doc.build(story)
    return response