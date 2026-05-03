import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL

# --- 1. Connect to your Postgres database ---
url = URL.create(
    "postgresql+psycopg2",
    username="ecoadmin",
    password="ecoequity25",
    host="127.0.0.1",
    port=5432,
    database="ecoequity",
)

engine = create_engine(url)

# --- 2. Query and display data ---
with engine.connect() as conn:
    # Verify connection
    whoami = conn.execute(text("SELECT current_user, current_database();")).all()
    print("Connected to:", whoami)

    # Total rows check
    total_rows = conn.execute(text("SELECT COUNT(*) FROM projects;")).scalar()
    print(f"\n Total rows in 'projects': {total_rows:,}")

    # Top donors
    result = conn.execute(text("""
        SELECT donor_name, COUNT(*) AS cnt
        FROM projects
        GROUP BY donor_name
        ORDER BY cnt DESC
        LIMIT 3;
    """))
    print("Top Donors:")
    for row in result:
        print(f"  {row.donor_name}: {row.cnt}")

    # Top Integrated sectors (if bucket exists)
    try:
        result = conn.execute(text("""
            SELECT sector_name, COUNT(*) AS cnt
            FROM projects
            WHERE bucket = 'Integrated'
            GROUP BY sector_name
            ORDER BY cnt DESC
            LIMIT 3;
        """))
        print("\n Top Integrated Sectors:")
        rows = result.fetchall()
        if rows:
            for row in rows:
                print(f"  {row.sector_name}: {row.cnt}")
        else:
            print("  (No Integrated projects found)")
    except Exception as e:
        print("\n Skipping Integrated Sectors query (column may not exist)")
        print("Reason:", e)

    # Optional small preview
    df = pd.read_sql("SELECT * FROM projects LIMIT 5;", con=engine)
    print("Sample Rows:")
    print(df)