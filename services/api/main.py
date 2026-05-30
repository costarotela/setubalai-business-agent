from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, clientes, productos, cobros, proveedores, empresas, categorias, reportes, salud, configuracion_agenda, catalogo_publico, especialidades, turnos
from routers.auth import router as auth_router
import os

app = FastAPI(
    title="SetubalAI Business Agent API",
    description="API para gestión empresarial — CRM, Cobros, Productos, Reportes",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3011",
        "http://localhost:3012",
        "http://100.72.101.29:3011",
        "http://100.72.101.29:3012",
        "https://business.setubalai.org",
        "https://admin.setubalai.org",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth routes (public — no requieren JWT)
app.include_router(auth_router)
# Business routes
app.include_router(clientes.router)
app.include_router(cobros.router)
app.include_router(productos.router)
app.include_router(reportes.router)
app.include_router(proveedores.router)
app.include_router(categorias.router)
app.include_router(empresas.router)
app.include_router(catalogo_publico.router)
# Health vertical routes
app.include_router(salud.router)
app.include_router(configuracion_agenda.router)
app.include_router(especialidades.router)
app.include_router(turnos.router)


@app.get("/")
def root():
    return {"api": "SetubalAI Business Agent", "version": "2.0.0", "status": "ok"}


@app.get("/health")
def health():
    return {"ok": True, "version": "2.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 3010)),
        reload=False
    )
