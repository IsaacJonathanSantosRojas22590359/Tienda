from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import usuarios, productos, ventas, reportes

app = FastAPI(
    title='Sistema Tienda API',
    description='API REST para gestión de tienda minorista',
    version='1.0.0'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://157.230.200.125'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(usuarios.router)
app.include_router(productos.router)
app.include_router(ventas.router)
app.include_router(reportes.router)

@app.get('/')
def root():
    return {'mensaje': 'API Tienda funcionando', 'docs': '/docs'}