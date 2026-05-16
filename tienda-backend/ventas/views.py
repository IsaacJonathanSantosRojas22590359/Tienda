from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import connection, transaction
from .models import Venta, DetalleVenta
from .serializers import VentaSerializer, VentaCrearSerializer

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