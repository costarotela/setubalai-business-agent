from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import clientes, cobros, productos, reportes, proveedores, empresas
from routers.auth import router as auth_router
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="SetubalAI Business Agent API",
    description="API para gestión empresarial — CRM, Cobros, Productos, Reportes",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://business.setubalai.org",
        "http://localhost:3011",
        "http://localhost:3000",
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
app.include_router(empresas.router)


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
