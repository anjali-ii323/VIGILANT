import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db, SessionLocal
from .. import models, schemas
from ..websocket_manager import manager
from .cases import simulate_case

router = APIRouter(prefix="/simulation", tags=["Simulation Control"])

class SimSettings:
    def __init__(self):
        self.running = False
        self.case_id = "CF-2026-00421"

sim_settings = SimSettings()

async def run_simulation_loop():
    while sim_settings.running:
        db = SessionLocal()
        try:
            case_id = sim_settings.case_id
            await simulate_case(case_id, {"action": "step"}, db)
        except Exception as e:
            print(f"Error in background simulation loop: {e}")
        finally:
            db.close()
        await asyncio.sleep(4.0)

@router.post("/start", response_model=schemas.SimulationStateSchema)
def start_simulation(background_tasks: BackgroundTasks, case_id: Optional[str] = "CF-2026-00421"):
    sim_settings.case_id = case_id
    if not sim_settings.running:
        sim_settings.running = True
        background_tasks.add_task(run_simulation_loop)
        
    return {
        "running": sim_settings.running,
        "current_step": 1,
        "total_steps": 5,
        "case_id": case_id,
        "last_event": f"Auto loop started for case {case_id}"
    }

@router.post("/pause", response_model=schemas.SimulationStateSchema)
def pause_simulation(case_id: Optional[str] = "CF-2026-00421"):
    sim_settings.running = False
    return {
        "running": sim_settings.running,
        "current_step": 1,
        "total_steps": 5,
        "case_id": case_id,
        "last_event": "Auto loop paused"
    }

@router.post("/reset", response_model=schemas.SimulationStateSchema)
async def reset_simulation(case_id: Optional[str] = "CF-2026-00421", db: Session = Depends(get_db)):
    sim_settings.running = False
    await simulate_case(case_id, {"action": "reset"}, db)
    return {
        "running": False,
        "current_step": 0,
        "total_steps": 5,
        "case_id": case_id,
        "last_event": f"Reset successful for case {case_id}"
    }

@router.get("/status", response_model=schemas.SimulationStateSchema)
def get_simulation_status(case_id: Optional[str] = "CF-2026-00421"):
    return {
        "running": sim_settings.running,
        "current_step": 1,
        "total_steps": 5,
        "case_id": case_id,
        "last_event": "Monitoring state active"
    }
