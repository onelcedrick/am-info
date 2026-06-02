# -*- coding: utf-8 -*-
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_token():
    res = client.post("/auth/login", json={"email": "client@aminfo.mg", "password": "client123"})
    return res.json()["token"]

def test_get_cart():
    token = get_token()
    response = client.get("/cart", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data

def test_add_to_cart():
    token = get_token()
    # D'abord recuperer un produit
    products = client.get("/products").json()
    if products["items"]:
        product_id = products["items"][0]["id"]
        response = client.post("/cart/items", 
            json={"product_id": product_id, "quantity": 1},
            headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200

def test_get_orders():
    token = get_token()
    response = client.get("/orders", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_cart_unauthorized():
    response = client.get("/cart")
    assert response.status_code == 401
