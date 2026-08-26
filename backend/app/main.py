import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import cases, accounts, transactions, predictions, alerts, reports, search, simulation
from .websocket_manager import manager
from .seed import seed_db

app = FastAPI(
    title="Vigilant Backend",
    description="Proactive Financial Cybercrime Intelligence & Cash-Out Prediction API",
    version="1.0.0"
)

# Configure CORS for Vite dev server (usually localhost:5173) and local deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(cases.router, prefix="/api")
app.include_router(accounts.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(predictions.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(simulation.router, prefix="/api")

@app.on_event("startup")
def startup_event():
    # If using local SQLite db and it is missing, create and seed it
    db_path = "./fintrace.db"
    # Create database tables
    Base.metadata.create_all(bind=engine)
    
    # We will seed the database automatically on startup if it's a fresh SQLite file
    # This guarantees that the hackathon judges have an immediate, working environment.
    if os.path.exists(db_path):
        # Check if we already have records in the database. If not, seed.
        from .database import SessionLocal
        from .models import Case
        db = SessionLocal()
        try:
            cases_count = db.query(Case).count()
            if cases_count == 0:
                print("Fresh database detected. Seeding data...")
                seed_db()
        except Exception as e:
            print(f"Error checking DB records: {e}")
        finally:
            db.close()
    else:
        print("Database file not found. Initializing and seeding...")
        seed_db()

# WebSockets Endpoint
@app.websocket("/ws/simulation")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Keep connection open. We will broadcast messages from the simulation router.
        while True:
            # Wait for any message from frontend (not strictly required, but keeps connection alive)
            data = await websocket.receive_text()
            # Echo or ignore
            await websocket.send_json({"type": "HEARTBEAT", "status": "ALIVE"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

# Serve Frontend Build Static Files
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))

if os.path.exists(frontend_dist):
    # Mount assets folder specifically to avoid conflicting with root wildcard
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    # Catch-all to serve index.html for SPA frontend routing
    @app.get("/{catchall:path}")
    async def read_index(catchall: str):
        # Allow API routes and WebSockets to pass through
        if catchall.startswith("api") or catchall.startswith("ws"):
            return None
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def read_root():
        return {
            "status": "VIGILANT_ONLINE",
            "mode": "SIMULATION_MODE",
            "sih_id": "SIH26184",
            "description": "Proactive Financial Cybercrime Intelligence Platform (Frontend build missing)"
        }
