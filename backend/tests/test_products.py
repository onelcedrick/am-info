# -*- coding: utf-8 -*-
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_products():
    response = client.get("/products?page=1&limit=12")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)

def test_get_products_default():
    response = client.get("/products")
    assert response.status_code == 200

def test_search_products():
    response = client.get("/products/search?q=ecran")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_product_not_found():
    response = client.get("/products/nonexistent-id")
    assert response.status_code == 200  # Retourne null

def test_new_arrivals():
    response = client.get("/products/new-arrivals")
    assert response.status_code == 200

def test_popular_products():
    response = client.get("/products/popular")
    assert response.status_code == 200
