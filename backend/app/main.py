# -*- coding: utf-8 -*-
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base
from .exceptions import register_exception_handlers
from .auth.router import router as auth_router
from .products.router import router as products_router, admin_router as products_admin_router
from .cart.router import router as cart_router
from .orders.router import router as orders_router, admin_router as orders_admin_router
from .tickets.router import router as tickets_router, technician_router as tickets_tech_router
from .discounts.router import router as discounts_router
from .ml.router import router as ml_router
from .invoices.router import router as invoices_router
from .categories.router import router as categories_router, public_router as categories_public_router
from .dashboard.router import router as dashboard_router
from .ratings.router import router as ratings_router
from .clients.router import router as clients_router
from .wishlist.router import router as wishlist_router
from .payments.router import router as payments_router, admin_router as payments_admin_router
from .websocket.router import router as ws_router

app = FastAPI(title="AM Info API", version="1.0")
register_exception_handlers(app)
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
app.include_router(ml_router)
app.include_router(invoices_router)
app.include_router(categories_router)
app.include_router(categories_public_router)
app.include_router(dashboard_router)
app.include_router(ratings_router)
app.include_router(clients_router)
app.include_router(wishlist_router)
app.include_router(payments_router)
app.include_router(payments_admin_router)
app.include_router(ws_router)

@app.get("/")
def root():
    return {"message": "AM Info API", "version": "1.0"}
