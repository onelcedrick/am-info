from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.connections = {}

    async def connect(self, websocket: WebSocket, user_id: str, role: str):
        await websocket.accept()
        self.connections[user_id] = {"ws": websocket, "role": role}

    def disconnect(self, user_id: str):
        self.connections.pop(user_id, None)

    async def send_to(self, user_id: str, data: dict):
        conn = self.connections.get(user_id)
        if conn:
            await conn["ws"].send_json(data)

    async def broadcast(self, data: dict):
        for conn in self.connections.values():
            await conn["ws"].send_json(data)

    def get_role(self, user_id: str):
        conn = self.connections.get(user_id)
        return conn["role"] if conn else None

manager = ConnectionManager()
