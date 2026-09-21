from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import init_db, get_db
from models import Alert, User
from schemas import AlertCreate, UserCreate
from ai_engine import get_embedding

app = FastAPI(title="AWAAZ Backend", description="Amplifying Welfare Across All Zones")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/")
def read_root():
    return {"message": "AWAAZ API is running and database is connected!"}

@app.post("/users/")
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    db_user = User(username=user_data.username, state=user_data.state)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"user_id": db_user.id, "username": db_user.username}

@app.post("/alerts/")
def create_alert(alert_data: AlertCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == alert_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    combined_text = f"{alert_data.title}: {alert_data.description}"
    new_embedding = get_embedding(combined_text)
    
    if not new_embedding:
        raise HTTPException(status_code=500, detail="Failed to generate AI embedding.")

    distance_calc = Alert.embedding.cosine_distance(new_embedding).label("distance")
    
    closest_alert = db.query(Alert, distance_calc).filter(
        Alert.zone == alert_data.zone,
        Alert.parent_alert_id == None
    ).order_by(distance_calc).first()

    potential_duplicate = None
    if closest_alert:
        alert_obj, distance = closest_alert
        similarity_score = 1 - distance
        
        if similarity_score > 0.75:
            potential_duplicate = {
                "id": alert_obj.id,
                "title": alert_obj.title,
                "description": alert_obj.description,
                "similarity_score": round(similarity_score * 100, 2)
            }

    db_alert = Alert(
        user_id=alert_data.user_id,
        zone=alert_data.zone,
        title=alert_data.title,
        description=alert_data.description,
        media_url=alert_data.media_url,
        embedding=new_embedding,
        parent_alert_id=potential_duplicate["id"] if potential_duplicate else None
    )
    
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)

    return {
        "message": "Alert created successfully!",
        "alert_id": db_alert.id,
        "is_duplicate": bool(potential_duplicate),
        "matched_parent_thread": potential_duplicate
    }

@app.get("/alerts/")
def get_alerts(db: Session = Depends(get_db)):
    alerts = db.query(Alert).order_by(Alert.id.desc()).all()
    return alerts

@app.post("/alerts/{alert_id}/upvote")
def upvote_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.upvotes += 1
    db.commit()
    return {"message": "Upvoted successfully!", "upvotes": alert.upvotes, "downvotes": alert.downvotes}

@app.post("/alerts/{alert_id}/downvote")
def downvote_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.downvotes += 1
    db.commit()
    return {"message": "Downvoted successfully!", "upvotes": alert.upvotes, "downvotes": alert.downvotes}

@app.get("/gov/summary/{zone}")
def get_gov_summary(zone: str, db: Session = Depends(get_db)):
    """Ranks alerts by net score and generates a Gov Dashboard summary."""
    # Fetch all alerts for the zone
    alerts = db.query(Alert).filter(Alert.zone == zone).all()
    
    if not alerts:
        return {"zone": zone, "summary": "No active issues reported in this zone.", "top_alerts": []}
    
    # Sort them by net score (upvotes - downvotes)
    alerts.sort(key=lambda x: (x.upvotes - x.downvotes), reverse=True)
    top_alerts = alerts[:3] # Grab the top 3 highest priority
    
    # Hackathon RAG Mock: Since Gemini was failing earlier, we will generate a 
    # dynamic deterministic summary to guarantee the demo works perfectly.
    issues_list = ", ".join([a.title.lower() for a in top_alerts])
    mock_summary = f"URGENT ATTENTION REQUIRED: The community has flagged critical infrastructure issues primarily concerning: {issues_list}. Immediate deployment of public works or traffic management teams is recommended based on citizen voting data."

    return {
        "zone": zone,
        "summary": mock_summary,
        "top_alerts": top_alerts
    }