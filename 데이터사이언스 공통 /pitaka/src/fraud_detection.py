from sklearn.ensemble import IsolationForest
import pandas as pd

def detect_anomalies(data):
    model = IsolationForest(contamination=0.1)
    model.fit(data[['amount']])
    data['anomaly'] = model.predict(data[['amount']])

    print("Anomaly results:", data[['amount', 'anomaly']])  # Debugging output

    # Log transactions marked as fraudulent
    fraudulent_transactions = data[data['anomaly'] == -1]
    if not fraudulent_transactions.empty:
        for _, transaction in fraudulent_transactions.iterrows():
            print(f"Possible Fraud Detected: Transaction ID {transaction.name}, Amount: {transaction['amount']}")

    return data
