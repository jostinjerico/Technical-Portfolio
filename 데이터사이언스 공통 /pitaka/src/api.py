from fastapi import FastAPI
from fraud_detection import detect_anomalies
from auth_module import generate_otp, verify_otp
from blockchain_logger import log_transaction
import pandas as pd

app = FastAPI()

@app.post("/transactions/")
def process_transaction(transaction_id: int, amount: float):
    secret = "JBSWY3DPEHPK3PXP"
    otp = generate_otp(secret)
    if not verify_otp(secret, otp):
        return {"status": "Authentication failed"}

    data = pd.DataFrame([{"transaction_id": transaction_id, "amount": amount}])
    anomalies = detect_anomalies(data)
    status = "fraudulent" if anomalies.loc[0, "anomaly"] == -1 else "legitimate"
    log_transaction(transaction_id, amount, status)
    return {"transaction_id": transaction_id, "amount": amount, "status": status}