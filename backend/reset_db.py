from sqlalchemy import create_engine
from database import Base
import models 

EXTERNAL_URL = "postgresql://awaaz_db_lo6t_user:LOsZs7O5miFI1GCO5sN0iK99iaNFkk7v@dpg-daokkn6gekts73cllep0-a.singapore-postgres.render.com/awaaz_db_lo6t"
engine = create_engine(EXTERNAL_URL)

print("Wiping old schema...")
Base.metadata.drop_all(bind=engine)

print("Applying new Auth + Location schema...")
Base.metadata.create_all(bind=engine)
print("✅ Database successfully upgraded!")