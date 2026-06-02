# -*- coding: utf-8 -*-
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_register():
    response = client.post("/auth/register", json={
        "full_name": "Test User",
        "email": "test@example.com",
        "password": "test123"
    })
    assert response.status_code in [200, 400]  # 400 si deja existe

def test_login():
    response = client.post("/auth/login", json={
        "email": "admin@aminfo.mg",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["user"]["role"] == "admin"

def test_login_invalid():
    response = client.post("/auth/login", json={
        "email": "admin@aminfo.mg",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_get_me():
    # Login d'abord
    login_res = client.post("/auth/login", json={
        "email": "admin@aminfo.mg",
        "password": "admin123"
    })
    token = login_res.json()["token"]
    
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["role"] == "admin"

def test_unauthorized():
    response = client.get("/auth/me")
    assert response.status_code == 401
