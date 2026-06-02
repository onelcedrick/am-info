# -*- coding: utf-8 -*-
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_token():
    res = client.post("/auth/login", json={"email": "client@aminfo.mg", "password": "client123"})
    return res.json()["token"]

def test_get_wishlist():
    token = get_token()
    response = client.get("/wishlist/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200

def test_get_wishlist_ids():
    token = get_token()
    response = client.get("/wishlist/ids", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200

def test_toggle_wishlist():
    token = get_token()
    products = client.get("/products").json()
    if products["items"]:
        pid = products["items"][0]["id"]
        response = client.post(f"/wishlist/{pid}", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert "added" in response.json()
