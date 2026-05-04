transactions = []

def log_transaction(transaction_id, amount, status):
    transaction = {
        "transaction_id": transaction_id,
        "amount": amount,
        "status": status
    }
    transactions.append(transaction)
    return transaction