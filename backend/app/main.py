from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_swagger_ui_oauth2_redirect_html
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import approvals, auth, events, health, registrations

_ORIGINS = [
    "http://127.0.0.1:8080",
    "http://localhost:8080",
    "http://[::1]:8080",
    "null",
]

_STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

_ROOT_HTML = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{settings.app_name}</title>
  <style>
    body {{ font-family: system-ui, sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem;
            line-height: 1.5; color: #111; background: #fafafa; }}
    h1 {{ font-size: 1.35rem; }}
    ul {{ padding-left: 1.2rem; }}
    a {{ color: #2563eb; }}
    code {{ background: #eee; padding: 0.1em 0.35em; border-radius: 4px; }}
    .note {{ font-size: 0.9rem; color: #555; margin-top: 1.5rem; }}
  </style>
</head>
<body>
  <h1>{settings.app_name}</h1>
  <p>This is the JSON API. Use the links below in your browser (no external CDN required for docs).</p>
  <ul>
    <li><a href="/docs"><strong>Interactive API docs (Swagger UI)</strong></a> — try endpoints here</li>
    <li><a href="/openapi.json">OpenAPI schema</a> (JSON)</li>
    <li><a href="/health">Health</a> (JSON)</li>
  </ul>
  <p class="note">If <code>/docs</code> was a blank white page before, it was loading scripts from the internet.
  This app now serves Swagger UI from <code>/static/swagger-ui/</code> so it works offline and behind strict firewalls.</p>
</body>
</html>
"""


def _browser_wants_html(request: Request) -> bool:
    accept = request.headers.get("accept", "")
    if not accept.strip():
        return False
    first = accept.split(",")[0].split(";")[0].strip().lower()
    return first == "text/html"


def create_app() -> FastAPI:
    application = FastAPI(
        title=settings.app_name,
        docs_url=None,
        redoc_url=None,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.mount(
        "/static",
        StaticFiles(directory=str(_STATIC_DIR)),
        name="static",
    )

    @application.get("/", tags=["meta"], response_model=None)
    async def root(request: Request) -> HTMLResponse | JSONResponse:
        if _browser_wants_html(request):
            return HTMLResponse(_ROOT_HTML)
        return JSONResponse(
            {
                "service": settings.app_name,
                "docs": "/docs",
                "openapi": "/openapi.json",
                "health": "/health",
                "note": "Open this URL in a browser for an HTML index, or use Accept: application/json.",
            }
        )

    @application.get("/docs/oauth2-redirect", include_in_schema=False)
    async def swagger_oauth2_redirect() -> HTMLResponse:
        return get_swagger_ui_oauth2_redirect_html()

    @application.get("/docs", include_in_schema=False)
    async def swagger_ui_html(request: Request) -> HTMLResponse:
        root_path = request.scope.get("root_path", "").rstrip("/")
        openapi_url = root_path + application.openapi_url
        oauth2_redirect_url = application.swagger_ui_oauth2_redirect_url
        if oauth2_redirect_url:
            oauth2_redirect_url = root_path + oauth2_redirect_url
        return get_swagger_ui_html(
            openapi_url=openapi_url,
            title=f"{settings.app_name} – Swagger UI",
            swagger_js_url=f"{root_path}/static/swagger-ui/swagger-ui-bundle.js",
            swagger_css_url=f"{root_path}/static/swagger-ui/swagger-ui.css",
            swagger_favicon_url=f"{root_path}/static/swagger-ui/favicon.png",
            oauth2_redirect_url=oauth2_redirect_url,
            swagger_ui_parameters=application.swagger_ui_parameters,
        )

    application.include_router(health.router)
    application.include_router(auth.router)
    application.include_router(events.router)
    application.include_router(registrations.router)
    application.include_router(approvals.router)
    return application


app = create_app()
