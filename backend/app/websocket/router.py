from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from ..auth.service import decode_token
from .manager import manager

router = APIRouter()

@router.websocket("/ws")
async def ws_endpoint(websocket: WebSocket, token: str = Query(...)):
    payload = decode_token(token)
    if not payload:
        await websocket.close()
        return
    
    user_id = payload.get("sub")
    role = payload.get("role", "client")
    await manager.connect(websocket, user_id, role)
    
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action", "message")
            recipient_id = data.get("recipient_id")
            
            # Si appel sans destinataire, envoyer a tous les techniciens
            if action == "call_start" and not recipient_id:
                if role == "client":
                    await manager.broadcast_to_role("technician", data)
                else:
                    await manager.broadcast(data, exclude=user_id)
            elif recipient_id:
                await manager.send_to(recipient_id, data)
            
            # Messages normaux
            if action == "message":
                await manager.broadcast({
                    "type": "new_message",
                    "ticket_id": data.get("ticket_id"),
                    "from": user_id
                }, exclude=user_id)
            
            if action == "typing" and recipient_id:
                await manager.send_to(recipient_id, {
                    "type": "typing", "from": user_id,
                    "ticket_id": data.get("ticket_id"),
                    "is_typing": data.get("is_typing", True)
                })
                    
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        manager.disconnect(user_id)
