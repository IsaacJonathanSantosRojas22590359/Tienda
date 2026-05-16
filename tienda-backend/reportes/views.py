from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import connection

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    with connection.cursor() as cursor:

        # Query: total ingresos del mes actual
        cursor.execute("""
            SELECT COALESCE(SUM(total), 0)
            FROM ventas
            WHERE MONTH(fecha) = MONTH(NOW())
              AND YEAR(fecha)  = YEAR(NOW())
        """)
        ingresos_mes = float(cursor.fetchone()[0])

        # Query: total ventas del mes
        cursor.execute("""
            SELECT COUNT(*) FROM ventas
            WHERE MONTH(fecha) = MONTH(NOW())
              AND YEAR(fecha)  = YEAR(NOW())
        """)
        ventas_mes = cursor.fetchone()[0]

        # Query: total productos activos en stock
        cursor.execute("""
            SELECT COALESCE(SUM(stock), 0)
            FROM productos WHERE activo = TRUE
        """)
        total_stock = int(cursor.fetchone()[0])

        # Query: productos con stock bajo (menos de 10)
        cursor.execute("""
            SELECT COUNT(*) FROM productos
            WHERE stock < 10 AND activo = TRUE
        """)
        stock_bajo = cursor.fetchone()[0]

        # Query: total empleados activos
        cursor.execute("""
            SELECT COUNT(*) FROM usuarios WHERE activo = TRUE
        """)
        empleados = cursor.fetchone()[0]

        # Query: últimas 5 ventas
        cursor.execute("""
            SELECT v.id, u.nombre, v.total, v.fecha, v.metodo_pago
            FROM ventas v
            INNER JOIN usuarios u ON v.usuario_id = u.id
            ORDER BY v.fecha DESC
            LIMIT 5
        """)
        ultimas = [
            {
                'id':         row[0],
                'empleado':   row[1],
                'total':      float(row[2]),
                'fecha':      row[3],
                'metodo_pago':row[4],
            }
            for row in cursor.fetchall()
        ]

        # Query: top 5 productos más vendidos
        cursor.execute("""
            SELECT p.nombre,
                   SUM(dv.cantidad)              AS unidades,
                   SUM(dv.subtotal)              AS ingresos
            FROM detalle_ventas dv
            INNER JOIN productos p ON dv.producto_id = p.id
            GROUP BY p.id, p.nombre
            ORDER BY unidades DESC
            LIMIT 5
        """)
        top_productos = [
            {
                'nombre':   row[0],
                'unidades': int(row[1]),
                'ingresos': float(row[2]),
            }
            for row in cursor.fetchall()
        ]

    return Response({
        'ingresos_mes':  ingresos_mes,
        'ventas_mes':    ventas_mes,
        'total_stock':   total_stock,
        'stock_bajo':    stock_bajo,
        'empleados':     empleados,
        'ultimas_ventas':ultimas,
        'top_productos': top_productos,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ventas_por_dia(request):
    desde = request.query_params.get('desde', '')
    hasta = request.query_params.get('hasta', '')

    # Query: ventas agrupadas por día en un rango de fechas
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT DATE(fecha)       AS dia,
                   COUNT(*)          AS total_ventas,
                   SUM(total)        AS ingresos
            FROM ventas
            WHERE DATE(fecha) BETWEEN %s AND %s
            GROUP BY DATE(fecha)
            ORDER BY dia ASC
        """, [desde, hasta])
        rows = cursor.fetchall()

    data = [
        {'dia': str(row[0]), 'total_ventas': row[1], 'ingresos': float(row[2])}
        for row in rows
    ]
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ventas_por_mes(request):
    # Query: ventas agrupadas por mes del año actual
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT MONTH(fecha)      AS mes,
                   COUNT(*)          AS total_ventas,
                   SUM(total)        AS ingresos
            FROM ventas
            WHERE YEAR(fecha) = YEAR(NOW())
            GROUP BY MONTH(fecha)
            ORDER BY mes ASC
        """)
        rows = cursor.fetchall()

    meses = ['Ene','Feb','Mar','Abr','May','Jun',
             'Jul','Ago','Sep','Oct','Nov','Dic']
    data  = [
        {
            'mes':          meses[row[0] - 1],
            'total_ventas': row[1],
            'ingresos':     float(row[2])
        }
        for row in rows
    ]
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def top_productos(request):
    limite = request.query_params.get('limite', 10)

    # Query: productos más vendidos con ingresos generados
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT p.nombre,
                   c.nombre                      AS categoria,
                   SUM(dv.cantidad)              AS unidades,
                   SUM(dv.subtotal)              AS ingresos
            FROM detalle_ventas dv
            INNER JOIN productos p ON dv.producto_id = p.id
            LEFT JOIN  categorias c ON p.categoria_id = c.id
            GROUP BY p.id, p.nombre, c.nombre
            ORDER BY unidades DESC
            LIMIT %s
        """, [int(limite)])
        columnas = [col[0] for col in cursor.description]
        rows     = cursor.fetchall()

    data = [dict(zip(columnas, row)) for row in rows]
    for item in data:
        item['ingresos'] = float(item['ingresos'])
        item['unidades'] = int(item['unidades'])
    return Response(data)