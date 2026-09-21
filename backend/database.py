from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import declarative_base

DATABASE_URL = "postgresql://awaaz_admin:supersecretpassword@127.0.0.1:5444/awaaz_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_db():
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
    
    import models
    Base.metadata.create_all(bind=engine)
    print("Database tables & pgvector initialized successfully!")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()