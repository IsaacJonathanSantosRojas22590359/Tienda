from rest_framework import serializers
from .models import Venta, DetalleVenta

class DetalleVentaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(
        source='producto.nombre', read_only=True
    )

    class Meta:
        model  = DetalleVenta
        fields = [
            'id', 'producto', 'producto_nombre',
            'cantidad', 'precio_unitario', 'subtotal'
        ]

class VentaSerializer(serializers.ModelSerializer):
    detalles       = DetalleVentaSerializer(many=True, read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)

    class Meta:
        model  = Venta
        fields = [
            'id', 'usuario', 'usuario_nombre',
            'total', 'fecha', 'metodo_pago', 'detalles'
        ]

class VentaCrearSerializer(serializers.Serializer):
    usuario_id  = serializers.IntegerField()
    metodo_pago = serializers.CharField(default='efectivo')
    detalles    = serializers.ListField(child=serializers.DictField())