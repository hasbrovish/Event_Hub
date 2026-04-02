from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import approvals, auth, events, health, registrations

_ORIGINS = [
    "http://127.0.0.1:8080",
    "http://localhost:8080",
    "http://[::1]:8080",
    "null",
]


def create_app() -> FastAPI:
    application = FastAPI(title=settings.app_name)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.include_router(health.router)
    application.include_router(auth.router)
    application.include_router(events.router)
    application.include_router(registrations.router)
    application.include_router(approvals.router)
    return application


app = create_app()
