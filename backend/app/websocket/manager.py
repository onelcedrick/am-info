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
            try:
                await conn["ws"].send_json(data)
                return True
            except:
                self.connections.pop(user_id, None)
        return False

    async def broadcast(self, data: dict, exclude: str = None):
        for uid, conn in list(self.connections.items()):
            if uid != exclude:
                try:
                    await conn["ws"].send_json(data)
                except:
                    self.connections.pop(uid, None)

    async def broadcast_to_role(self, role: str, data: dict):
        for uid, conn in list(self.connections.items()):
            if conn["role"] == role:
                try:
                    await conn["ws"].send_json(data)
                except:
                    self.connections.pop(uid, None)

manager = ConnectionManager()
