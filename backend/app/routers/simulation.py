import asyncio
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db, SessionLocal
from .. import models, schemas
from ..websocket_manager import manager

router = APIRouter(prefix="/simulation", tags=["Simulation Control"])

class SimStateTracker:
    def __init__(self):
        self.running = False
        self.case_id = "CF-2026-00421"
        self.current_step = 0
        self.total_steps = 5

tracker = SimStateTracker()

@router.post("/step", response_model=schemas.SimulationStateSchema)
async def step_simulation(case_id: Optional[str] = "CF-2026-00421", db: Session = Depends(get_db)):
    clean_id = (case_id or "CF-2026-00421").strip().upper().replace("_", "-")
    tracker.current_step = (tracker.current_step % 5) + 1
    
    # Generate realistic dynamic step
    steps_events = [
        ("INITIAL_COMPLAINT", "Victim reported unauthorized ₹1,00,000 transfer from SBI account 30291488102.", 100000.0, "WARNING"),
        ("MULE_INFLOW", "Funds entered Canara Bank MULE-A457 (Mohammad Farooq) via instant IMPS transfer.", 100000.0, "CRITICAL"),
        ("LAYER_SPLIT", "MULE-A457 structure-split ₹60,000 to PNB MULE-B821 and ₹40,000 to Union Bank MULE-C912.", 60000.0, "CRITICAL"),
        ("ATM_EXTRACTION_ALERT", "Union Bank MULE-C912 triggered ATM extraction alert at Dadar West Terminal (ATM-Z03).", 40000.0, "CRITICAL"),
        ("CONTAINMENT_RECOMMENDED", "Heuristic prediction window active (20–40 min lead time). Freeze lock recommended.", 40000.0, "CRITICAL")
    ]
    
    ev_type, desc, amt, risk = steps_events[tracker.current_step - 1]
    
    # Broadcast event to all WebSocket clients
    await manager.broadcast({
        "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
        "amount": amt,
        "description": desc,
        "risk_level": risk,
        "event_type": ev_type,
        "meta": {"case_id": clean_id, "step": tracker.current_step}
    })
    
    return {
        "running": tracker.running,
        "current_step": tracker.current_step,
        "total_steps": tracker.total_steps,
        "case_id": clean_id,
        "last_event": desc
    }

@router.post("/start", response_model=schemas.SimulationStateSchema)
def start_simulation(case_id: Optional[str] = "CF-2026-00421"):
    tracker.running = True
    tracker.case_id = case_id or "CF-2026-00421"
    return {
        "running": True,
        "current_step": tracker.current_step,
        "total_steps": 5,
        "case_id": tracker.case_id,
        "last_event": f"Simulation feed started for case {tracker.case_id}"
    }

@router.post("/pause", response_model=schemas.SimulationStateSchema)
def pause_simulation(case_id: Optional[str] = "CF-2026-00421"):
    tracker.running = False
    return {
        "running": False,
        "current_step": tracker.current_step,
        "total_steps": 5,
        "case_id": case_id or tracker.case_id,
        "last_event": "Simulation feed paused"
    }

@router.post("/reset", response_model=schemas.SimulationStateSchema)
async def reset_simulation(case_id: Optional[str] = "CF-2026-00421", db: Session = Depends(get_db)):
    clean_id = (case_id or "CF-2026-00421").strip().upper().replace("_", "-")
    tracker.running = False
    tracker.current_step = 0
    
    await manager.broadcast({
        "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
        "amount": 0.0,
        "description": f"Simulation reset to initial complaint state for {clean_id}.",
        "risk_level": "INFO",
        "event_type": "SYSTEM",
        "meta": {"case_id": clean_id}
    })
    
    return {
        "running": False,
        "current_step": 0,
        "total_steps": 5,
        "case_id": clean_id,
        "last_event": "Simulation reset to baseline"
    }
