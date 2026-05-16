from django.db import models

# Create your models here.
from django.db import models

class Categoria(models.Model):
    nombre      = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'categorias'

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    nombre       = models.CharField(max_length=200)
    precio       = models.DecimalField(max_digits=10, decimal_places=2)
    stock        = models.IntegerField(default=0)
    descripcion  = models.TextField(blank=True, null=True)
    categoria    = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True)
    activo       = models.BooleanField(default=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'productos'

    def __str__(self):
        return self.nombre