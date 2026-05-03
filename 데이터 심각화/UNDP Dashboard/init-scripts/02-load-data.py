import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL

def load_data_to_db():
    # 1. load & clean
    df = pd.read_csv("public/data/raw/crs_data_final_v2.csv").rename(columns={
        "ProjectNumber": "project_number",
        "Year": "year",
        "DonorName": "donor_name",
        "RecipientName": "recipient_name",
        "RegionName": "region_name",
        "SectorName": "sector_name",
        "USD_Commitment_imputed": "usd_commitment_imputed",
        "USD_Disbursement": "usd_disbursement",
        "ProjectTitle": "project_title",
        "LongDescription": "long_description",
        "Gender": "gender",
        "ClimateMitigation": "climate_mitigation",
        "ClimateAdaptation": "climate_adaptation",
    }).fillna({
        "project_number": "unspecified",
        "project_title": "",
        "long_description": "",
        "usd_commitment_imputed": 0,
        "usd_disbursement": 0,
    })

    url = URL.create(
        "postgresql+psycopg2",
        username="ecoadmin",
        password="ecoequity25",  
        host="127.0.0.1",       # use 'db' instead of 127.0.0.1 if you're calling from another container
        port=5432,
        database="ecoequity",   # make sure spelling matches the DB you actually have
    )
    engine = create_engine(url)

    # smoke test (optional)
    with engine.connect() as conn:
        print(conn.execute(text("SELECT current_user, current_database();")).all())
        # should print [('ecoadmin', 'ecoequity')]

    # write
    df.to_sql(
        "projects",
        con=engine,
        schema="public",
        if_exists="append",
        index=False,
        method="multi",
        chunksize=10_000,
    )

    print(f"Loaded {len(df)} rows into public.projects")

if __name__ == '__main__': 
    load_data_to_db()