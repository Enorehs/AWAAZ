from sqlalchemy import create_engine, text
from database import Base
import models 

EXTERNAL_URL = "postgresql://postgres.ahjalsthkdzegatjybke:mjbZT9yl3h8InVYL@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
engine = create_engine(EXTERNAL_URL)

print("Enabling AI Vector Extension on Supabase...")
with engine.connect() as conn:
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
    conn.commit()

print("Wiping old schema...")
Base.metadata.drop_all(bind=engine)

print("Applying new Auth + Location schema...")
Base.metadata.create_all(bind=engine)
print("✅ Database successfully upgraded!")