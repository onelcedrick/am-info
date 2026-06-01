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
            
            if action == "typing":
                if recipient_id:
                    await manager.send_to(recipient_id, {
                        "type": "typing",
                        "from": user_id,
                        "ticket_id": data.get("ticket_id"),
                        "is_typing": data.get("is_typing", True)
                    })
            
            elif action == "call_start":
                # Appel vocal/vidéo
                if recipient_id:
                    await manager.send_to(recipient_id, {
                        "type": "incoming_call",
                        "from": user_id,
                        "ticket_id": data.get("ticket_id"),
                        "call_type": data.get("call_type", "video"),
                        "offer": data.get("offer")
                    })
            
            elif action == "call_answer":
                if recipient_id:
                    await manager.send_to(recipient_id, {
                        "type": "call_answered",
                        "from": user_id,
                        "answer": data.get("answer")
                    })
            
            elif action == "ice_candidate":
                if recipient_id:
                    await manager.send_to(recipient_id, {
                        "type": "ice_candidate",
                        "from": user_id,
                        "candidate": data.get("candidate")
                    })
            
            elif action == "call_end":
                if recipient_id:
                    await manager.send_to(recipient_id, {
                        "type": "call_ended",
                        "from": user_id
                    })
            
            elif action == "call_reject":
                if recipient_id:
                    await manager.send_to(recipient_id, {
                        "type": "call_rejected",
                        "from": user_id
                    })
            
            elif action == "message":
                await manager.broadcast({
                    "type": "new_message",
                    "ticket_id": data.get("ticket_id"),
                    "from": user_id
                })
                
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception:
        manager.disconnect(user_id)
