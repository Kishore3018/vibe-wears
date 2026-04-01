import os
import uuid
import shutil
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Query, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from typing import Optional

from database.connection import engine, Base, get_db
from models import models
from routers import auth, products, cart, orders, categories, addresses, wishlist, admin, payments, ai
from websocket.manager import manager
from utils.auth import decode_token

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

# Create uploads directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize FastAPI app
app = FastAPI(
    title="Vibe Wears API",
    description="E-commerce API for Vibe Wears - Premium Men's Fashion Store",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:4200").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(categories.router)
app.include_router(addresses.router)
app.include_router(wishlist.router)
app.include_router(admin.router)
app.include_router(payments.router)
app.include_router(ai.router)


# ============== Image Upload Endpoint ==============
@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image file and return its URL"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        return {"success": False, "error": "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."}
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # Save file
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Return URL
    return {
        "success": True,
        "url": f"http://localhost:8000/uploads/{filename}",
        "filename": filename
    }


# ============== WebSocket Endpoints ==============
@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    """Main WebSocket endpoint for real-time updates"""
    user_id = None
    
    # Authenticate if token provided
    if token:
        token_data = decode_token(token)
        if token_data:
            user_id = token_data.user_id
    
    await manager.connect(websocket, user_id=user_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # Handle different message types
            message_type = data.get("type")
            
            if message_type == "subscribe_product":
                # Subscribe to product updates
                product_id = data.get("product_id")
                if product_id:
                    room = f"product_{product_id}"
                    if room not in manager.rooms:
                        manager.rooms[room] = set()
                    manager.rooms[room].add(websocket)
                    await websocket.send_json({
                        "type": "subscribed",
                        "room": room
                    })
            
            elif message_type == "unsubscribe_product":
                # Unsubscribe from product updates
                product_id = data.get("product_id")
                if product_id:
                    room = f"product_{product_id}"
                    if room in manager.rooms:
                        manager.rooms[room].discard(websocket)
            
            elif message_type == "ping":
                # Keep alive
                await websocket.send_json({"type": "pong"})
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id=user_id)


@app.websocket("/ws/admin")
async def admin_websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    """Admin WebSocket endpoint for order notifications"""
    from sqlalchemy.orm import Session
    from database.connection import SessionLocal
    
    # Verify admin token
    token_data = decode_token(token)
    if not token_data:
        await websocket.close(code=4001)
        return
    
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.id == token_data.user_id).first()
        if not user or not user.is_admin:
            await websocket.close(code=4003)
            return
    finally:
        db.close()
    
    await manager.connect(websocket, user_id=token_data.user_id, room="admin")
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id=token_data.user_id, room="admin")


# ============== Health Check ==============
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "websocket_stats": manager.get_stats()
    }


# ============== Root Endpoint ==============
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Vibe Wears API",
        "docs": "/api/docs",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug
    )
