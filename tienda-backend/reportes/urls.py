from django.urls import path
from .views import dashboard, ventas_por_dia, ventas_por_mes, top_productos, exportar_pdf, exportar_excel

urlpatterns = [
    path('reportes/dashboard/',      dashboard,       name='dashboard'),
    path('reportes/ventas-por-dia/', ventas_por_dia,  name='ventas-por-dia'),
    path('reportes/ventas-por-mes/', ventas_por_mes,  name='ventas-por-mes'),
    path('reportes/top-productos/',  top_productos,   name='top-productos'),
    path('reportes/exportar/pdf/',   exportar_pdf,   name='exportar-pdf'),
    path('reportes/exportar/excel/', exportar_excel, name='exportar-excel'),
]