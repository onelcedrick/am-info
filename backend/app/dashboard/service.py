# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from ..models import Order, Product, Ticket, User
from ..redis_client import cache

def get_dashboard_stats(db: Session):
    cached = cache.get("dashboard:admin_stats")
    if cached:
        return cached
    
    now = datetime.utcnow()
    last_30_days = now - timedelta(days=30)
    
    total_orders = db.query(Order).count()
    orders_by_status = {}
    for status in ['pending', 'awaiting_payment', 'paid', 'preparing', 'ready', 'delivered', 'cancelled']:
        orders_by_status[status] = db.query(Order).filter(Order.status == status).count()
    
    total_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.status.in_(['paid', 'delivered', 'ready'])
    ).scalar() or 0
    
    daily_orders = []
    for i in range(7):
        day = now - timedelta(days=6-i)
        day_start = day.replace(hour=0, minute=0, second=0)
        day_end = day.replace(hour=23, minute=59, second=59)
        count = db.query(Order).filter(Order.created_at >= day_start, Order.created_at <= day_end).count()
        daily_orders.append({"date": day.strftime('%d/%m'), "count": count})
    
    tickets_by_status = {}
    for status in ['open', 'assigned', 'in_progress', 'resolved', 'closed']:
        tickets_by_status[status] = db.query(Ticket).filter(Ticket.status == status).count()
    
    categories = db.query(Product.category, func.count(Product.id)).filter(
        Product.category != None, Product.category != ''
    ).group_by(Product.category).order_by(func.count(Product.id).desc()).limit(5).all()
    top_categories = [{"name": c[0], "count": c[1]} for c in categories]
    
    low_stock = db.query(Product).filter(Product.stock_quantity <= 5, Product.stock_quantity > 0).count()
    out_of_stock = db.query(Product).filter(Product.stock_quantity == 0).count()
    total_clients = db.query(User).filter(User.role == 'client').count()
    revenue_30d = db.query(func.sum(Order.total_amount)).filter(
        Order.created_at >= last_30_days, Order.status.in_(['paid', 'delivered'])
    ).scalar() or 0
    
    result = {
        "total_orders": total_orders, "orders_by_status": orders_by_status,
        "total_revenue": float(total_revenue), "revenue_30d": float(revenue_30d),
        "daily_orders": daily_orders, "tickets_by_status": tickets_by_status,
        "top_categories": top_categories, "low_stock": low_stock,
        "out_of_stock": out_of_stock, "total_clients": total_clients,
        "total_products": db.query(Product).count(), "total_tickets": db.query(Ticket).count()
    }
    
    cache.set("dashboard:admin_stats", result, ttl=120)
    return result
