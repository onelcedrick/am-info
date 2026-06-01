# -*- coding: utf-8 -*-
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base
from .auth.router import router as auth_router
from .products.router import router as products_router, admin_router as products_admin_router
from .cart.router import router as cart_router
from .orders.router import router as orders_router, admin_router as orders_admin_router
from .tickets.router import router as tickets_router, technician_router as tickets_tech_router
from .discounts.router import router as discounts_router
from .websocket.router import router as ws_router

app = FastAPI(title="AM Info API", version="1.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(products_router)
app.include_router(products_admin_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(orders_admin_router)
app.include_router(tickets_router)
app.include_router(tickets_tech_router)
app.include_router(discounts_router)
app.include_router(ws_router)

@app.get("/")
def root():
    return {"message": "AM Info API", "version": "1.0"}
