from django.db import models

class Usuario(models.Model):
    ROL_CHOICES = [
        ('admin',    'Administrador'),
        ('empleado', 'Empleado'),
    ]
    nombre        = models.CharField(max_length=150)
    email         = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    rol           = models.CharField(max_length=10, choices=ROL_CHOICES, default='empleado')
    activo        = models.BooleanField(default=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'usuarios'

    def __str__(self):
        return f'{self.nombre} ({self.rol})'