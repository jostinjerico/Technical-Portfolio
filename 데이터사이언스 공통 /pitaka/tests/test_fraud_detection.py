import pandas as pd
from fraud_detection import detect_anomalies

def test_anomaly_detection_with_mixed_data():
    # Test case with two legitimate and one fraudulent transaction
    data = pd.DataFrame({"transaction_id": [1, 2, 3], "amount": [10, 20, 15000]})  # 15000 is expected to be fraudulent

    # Run the fraud detection
    results = detect_anomalies(data)

    # Output the results for visibility
    print("\nTransaction Results:")
    for _, row in results.iterrows():
        status = "Fraudulent" if row['anomaly'] == -1 else "Legitimate"
        print(f"Transaction ID: {row['transaction_id']}, Amount: {row['amount']}, Status: {status}")

    # Assert the anomaly column exists
    assert "anomaly" in results.columns

    # Assert at least 2 transactions are legitimate (anomaly == 1)
    legitimate_count = sum(results["anomaly"] == 1)
    assert legitimate_count == 2, f"Expected 2 legitimate transactions, got {legitimate_count}"

    # Assert exactly 1 transaction is marked as fraudulent (anomaly == -1)
    fraudulent_count = sum(results["anomaly"] == -1)
    assert fraudulent_count == 1, f"Expected 1 fraudulent transaction, got {fraudulent_count}"

    # Verify the fraudulent transaction is the one with the amount 15000
    fraudulent_transaction = results[results["anomaly"] == -1]
    assert fraudulent_transaction.iloc[0]["amount"] == 15000, \
        f"Expected fraudulent transaction with amount 15000, got {fraudulent_transaction.iloc[0]['amount']}"
