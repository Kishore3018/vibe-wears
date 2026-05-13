from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set, Optional
import json
import asyncio
from datetime import datetime


class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        # Store active connections by user_id
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # Store connections by room (for broadcast)
        self.rooms: Dict[str, Set[WebSocket]] = {}
        # Anonymous connections (for product updates, etc.)
        self.anonymous_connections: Set[WebSocket] = set()
    
    async def connect(self, websocket: WebSocket, user_id: Optional[int] = None, room: Optional[str] = None):
        """Accept a WebSocket connection"""
        await websocket.accept()
        
        if user_id:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = set()
            self.active_connections[user_id].add(websocket)
        else:
            self.anonymous_connections.add(websocket)
        
        if room:
            if room not in self.rooms:
                self.rooms[room] = set()
            self.rooms[room].add(websocket)
        
        print(f"New WebSocket connection: user_id={user_id}, room={room}")
    
    def disconnect(self, websocket: WebSocket, user_id: Optional[int] = None, room: Optional[str] = None):
        """Handle WebSocket disconnection"""
        if user_id and user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        self.anonymous_connections.discard(websocket)
        
        if room and room in self.rooms:
            self.rooms[room].discard(websocket)
            if not self.rooms[room]:
                del self.rooms[room]
        
        # Clean up from all rooms
        for room_name, connections in list(self.rooms.items()):
            connections.discard(websocket)
            if not connections:
                del self.rooms[room_name]
    
    async def send_personal_message(self, message: dict, user_id: int):
        """Send message to a specific user's all connections"""
        if user_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)
            
            # Clean up disconnected
            for conn in disconnected:
                self.disconnect(conn, user_id)
    
    async def broadcast_to_room(self, message: dict, room: str):
        """Broadcast message to all connections in a room"""
        if room in self.rooms:
            disconnected = []
            for connection in self.rooms[room]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)
            
            # Clean up disconnected
            for conn in disconnected:
                self.disconnect(conn, room=room)
    
    async def broadcast_to_all(self, message: dict):
        """Broadcast message to all connections"""
        # Send to authenticated users
        for user_id, connections in list(self.active_connections.items()):
            disconnected = []
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)
            for conn in disconnected:
                self.disconnect(conn, user_id)
        
        # Send to anonymous connections
        disconnected = []
        for connection in self.anonymous_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)
    
    async def notify_order_update(self, user_id: int, order_data: dict):
        """Notify user about order status update"""
        message = {
            "type": "order_update",
            "data": order_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.send_personal_message(message, user_id)

    async def notify_admin_new_order(self, order_data: dict):
        """Broadcast new order notifications to admin clients"""
        message = {
            "type": "new_order_notification",
            "data": order_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_room(message, "admin")
    
    async def notify_stock_update(self, product_id: int, quantity: int):
        """Broadcast stock update to all clients"""
        message = {
            "type": "stock_update",
            "data": {
                "product_id": product_id,
                "quantity": quantity
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        # Broadcast to product room
        room = f"product_{product_id}"
        await self.broadcast_to_room(message, room)
        # Also broadcast to all
        await self.broadcast_to_all(message)
    
    async def notify_new_product(self, product_data: dict):
        """Broadcast new product to all clients"""
        message = {
            "type": "new_product",
            "data": product_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_all(message)
    
    async def notify_price_update(self, product_id: int, new_price: float, old_price: float):
        """Broadcast price update"""
        message = {
            "type": "price_update",
            "data": {
                "product_id": product_id,
                "new_price": new_price,
                "old_price": old_price
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        room = f"product_{product_id}"
        await self.broadcast_to_room(message, room)
        await self.broadcast_to_all(message)
    
    async def notify_flash_sale(self, sale_data: dict):
        """Broadcast flash sale notification"""
        message = {
            "type": "flash_sale",
            "data": sale_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_all(message)
    
    async def notify_cart_reminder(self, user_id: int, cart_data: dict):
        """Send cart reminder to user"""
        message = {
            "type": "cart_reminder",
            "data": cart_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.send_personal_message(message, user_id)
    
    def get_stats(self) -> dict:
        """Get connection statistics"""
        total_authenticated = sum(len(conns) for conns in self.active_connections.values())
        return {
            "authenticated_users": len(self.active_connections),
            "authenticated_connections": total_authenticated,
            "anonymous_connections": len(self.anonymous_connections),
            "rooms": len(self.rooms),
            "total_connections": total_authenticated + len(self.anonymous_connections)
        }


# Global connection manager instance
manager = ConnectionManager()
