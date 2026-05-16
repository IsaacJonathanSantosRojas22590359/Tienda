from django.db import models
from usuarios.models import Usuario
from productos.models import Producto

class Venta(models.Model):
    usuario     = models.ForeignKey(Usuario,  on_delete=models.RESTRICT)
    total       = models.DecimalField(max_digits=10, decimal_places=2)
    fecha       = models.DateTimeField(auto_now_add=True)
    metodo_pago = models.CharField(max_length=50, default='efectivo')

    class Meta:
        db_table = 'ventas'

    def __str__(self):
        return f'Venta #{self.id} — ${self.total}'


class DetalleVenta(models.Model):
    venta           = models.ForeignKey(Venta,   on_delete=models.CASCADE,  related_name='detalles')
    producto        = models.ForeignKey(Producto, on_delete=models.RESTRICT)
    cantidad        = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal        = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'detalle_ventas'