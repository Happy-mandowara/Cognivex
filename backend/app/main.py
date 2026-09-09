from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from .core.config import settings
from .core.database import engine, Base, SessionLocal
from .models.models import Patient, User
from .core.auth import seed_demo_users
from .api import (
    routes_auth,
    routes_admin,
    routes_patients,
    routes_kiosk,
    routes_ai,
    routes_ayush,
    routes_doctor,
    routes_abdm,
    routes_demo,
    routes_abha,
    routes_documents
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medikiosk")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    logger.info("Initializing MediKiosk database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed demo users and clinical dataset
    db = SessionLocal()
    try:
        seed_demo_users(db)
        logger.info("Demo users verified/seeded (admin, doctor, patient).")
        if db.query(Patient).count() == 0:
            logger.info("Seeding initial SIH PS-26047 demo dataset...")
            routes_demo.run_sih_demo(db)
            logger.info("Demo dataset populated successfully.")
    except Exception as e:
        logger.error(f"Error checking/seeding demo data: {e}")
    finally:
        db.close()
        
    yield
    logger.info("MediKiosk shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade Electronic Health Record (EHR) and Patient Intake System with Ayush Decision Support and ABDM/FHIR Compliance.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(routes_auth.router, prefix=settings.API_V1_STR)
app.include_router(routes_admin.router, prefix=settings.API_V1_STR)
app.include_router(routes_patients.router, prefix=settings.API_V1_STR)
app.include_router(routes_kiosk.router, prefix=settings.API_V1_STR)
app.include_router(routes_ai.router, prefix=settings.API_V1_STR)
app.include_router(routes_ayush.router, prefix=settings.API_V1_STR)
app.include_router(routes_doctor.router, prefix=settings.API_V1_STR)
app.include_router(routes_abdm.router, prefix=settings.API_V1_STR)
app.include_router(routes_demo.router, prefix=settings.API_V1_STR)
app.include_router(routes_abha.router, prefix=settings.API_V1_STR)
app.include_router(routes_documents.router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Root"])
def root():
    return {
        "name": "MediKiosk API",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "HEALTHY",
        "project": "MediKiosk Clinical SaaS",
        "version": settings.VERSION,
        "database": "CONNECTED",
        "abdm_gateway": "ONLINE (NRCES FHIR R4)",
        "ayush_engine": "READY (Prakriti + Kent/Boericke + NAMASTE-ICD)"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
