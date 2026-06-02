# -*- coding: utf-8 -*-
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_token(role="client"):
    emails = {"client": "client@aminfo.mg", "tech": "tech@aminfo.mg", "admin": "admin@aminfo.mg"}
    passwords = {"client": "client123", "tech": "tech123", "admin": "admin123"}
    res = client.post("/auth/login", json={"email": emails[role], "password": passwords[role]})
    return res.json()["token"]

def test_create_ticket():
    token = get_token("client")
    response = client.post("/tickets", 
        json={"subject": "Test ticket", "description": "Test description", "priority": "normal"},
        headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["subject"] == "Test ticket"
    assert data["status"] == "open"

def test_get_my_tickets():
    token = get_token("client")
    response = client.get("/tickets", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_tech_get_tickets():
    token = get_token("tech")
    response = client.get("/technician/tickets", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_assign_ticket():
    tech_token = get_token("tech")
    client_token = get_token("client")
    
    # Creer un ticket
    ticket = client.post("/tickets", 
        json={"subject": "Assign test", "description": "Test", "priority": "normal"},
        headers={"Authorization": f"Bearer {client_token}"}).json()
    
    # Assigner
    response = client.put(f"/technician/tickets/{ticket['id']}/assign",
        headers={"Authorization": f"Bearer {tech_token}"})
    assert response.status_code == 200
