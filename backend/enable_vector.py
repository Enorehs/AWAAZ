from sqlalchemy import create_engine, text

# Connects to your live database from your laptop
EXTERNAL_URL = "postgresql://awaaz_db_lo6t_user:LOsZs7O5miFI1GCO5sN0iK99iaNFkk7v@dpg-daokkn6gekts73cllep0-a.singapore-postgres.render.com/awaaz_db_lo6t"
engine = create_engine(EXTERNAL_URL)

with engine.connect() as conn:
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
    conn.commit()

print("✅ pgvector successfully installed on Render!")