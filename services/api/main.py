from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, empresas, salud, configuracion_agenda, catalogo_publico, especialidades, turnos, obras_sociales, whatsapp
from routers.auth import router as auth_router
from auth_middleware import AuthMiddleware
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
        "https://dev.setubalai.org",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Middleware de autorización global ──────────────────────────────
# Centraliza: JWT parse, tenancy (empresa_id), control de acceso por rol.
# Los endpoints ya NO necesitan Depends(get_medico_restriction) —
# usan request.state.user_rol, request.state.medico_id, request.state.es_admin
app.add_middleware(AuthMiddleware)

# Auth routes (public — no requieren JWT)
app.include_router(auth_router)
# Business routes
app.include_router(empresas.router)
app.include_router(catalogo_publico.router)
# Health vertical routes
app.include_router(salud.router)
app.include_router(configuracion_agenda.router)
app.include_router(especialidades.router)
app.include_router(turnos.router)
app.include_router(obras_sociales.router)
# WhatsApp webhook (public — no requiere auth)
app.include_router(whatsapp.router, prefix="")


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
