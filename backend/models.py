from sqlalchemy import Column, Integer, String, Text, ForeignKey
from pgvector.sqlalchemy import Vector
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    state = Column(String)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    zone = Column(String)
    title = Column(String)
    description = Column(Text)
    media_url = Column(String, nullable=True)
    embedding = Column(Vector(768))
    parent_alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)
    
    # Split voting columns
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)