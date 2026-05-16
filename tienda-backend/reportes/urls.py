from django.urls import path
from .views import dashboard, ventas_por_dia, ventas_por_mes, top_productos

urlpatterns = [
    path('reportes/dashboard/',      dashboard,       name='dashboard'),
    path('reportes/ventas-por-dia/', ventas_por_dia,  name='ventas-por-dia'),
    path('reportes/ventas-por-mes/', ventas_por_mes,  name='ventas-por-mes'),
    path('reportes/top-productos/',  top_productos,   name='top-productos'),
]