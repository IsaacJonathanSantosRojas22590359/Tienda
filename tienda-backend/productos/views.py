from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import connection
from .models import Producto, Categoria
from .serializers import ProductoSerializer, CategoriaSerializer

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset           = Categoria.objects.all()
    serializer_class   = CategoriaSerializer
    permission_classes = [IsAuthenticated]


class ProductoViewSet(viewsets.ModelViewSet):
    serializer_class   = ProductoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Query: listar productos activos con su categoría
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT p.id
                FROM productos p
                LEFT JOIN categorias c ON p.categoria_id = c.id
                WHERE p.activo = TRUE
                ORDER BY p.nombre ASC
            """)
            ids = [row[0] for row in cursor.fetchall()]
        return Producto.objects.filter(id__in=ids).select_related('categoria')

    def destroy(self, request, *args, **kwargs):
        # Query: soft delete de producto
        producto = self.get_object()
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE productos SET activo = FALSE WHERE id = %s
            """, [producto.id])
        return Response({'mensaje': 'Producto eliminado'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def productos_stock_bajo(request):
    # Query: productos con stock menor a 10
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT p.id, p.nombre, p.stock, c.nombre as categoria
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.stock < 10 AND p.activo = TRUE
            ORDER BY p.stock ASC
        """)
        columnas = [col[0] for col in cursor.description]
        rows     = cursor.fetchall()

    data = [dict(zip(columnas, row)) for row in rows]
    return Response(data)