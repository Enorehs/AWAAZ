from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from database import Base
import datetime
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    role = Column(String, default="citizen") # 'citizen' or 'gov'
    state = Column(String)
    city = Column(String)
    
    alerts = relationship("Alert", back_populates="author")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    author = relationship("User", back_populates="alerts")
    zone = Column(String)
    title = Column(String)
    description = Column(Text)
    media_url = Column(String, nullable=True)
    embedding = Column(Vector(768))
    parent_alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)
    
    # Split voting columns
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)