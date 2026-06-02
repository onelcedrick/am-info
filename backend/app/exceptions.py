# -*- coding: utf-8 -*-
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

def register_exception_handlers(app: FastAPI):
    
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": True,
                "status": exc.status_code,
                "message": exc.detail,
                "path": str(request.url.path)
            }
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = []
        for error in exc.errors():
            field = " -> ".join(str(loc) for loc in error["loc"])
            errors.append(f"{field}: {error['msg']}")
        
        return JSONResponse(
            status_code=422,
            content={
                "error": True,
                "status": 422,
                "message": "Erreur de validation",
                "details": errors,
                "path": str(request.url.path)
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        import traceback
        print(f"❌ Erreur interne: {exc}\n{traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={
                "error": True,
                "status": 500,
                "message": "Erreur interne du serveur. Veuillez reessayer.",
                "path": str(request.url.path)
            }
        )
    
    @app.exception_handler(404)
    async def not_found_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=404,
            content={
                "error": True,
                "status": 404,
                "message": f"Route introuvable: {request.url.path}",
                "path": str(request.url.path)
            }
        )
