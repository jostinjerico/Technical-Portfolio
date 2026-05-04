import streamlit as st
import pandas as pd

data = pd.DataFrame({
    "transaction_id": [1, 2, 3],
    "amount": [100, 5000, 20],
    "status": ["legitimate", "fraudulent", "legitimate"]
})

st.title("SecureWalletGuard Dashboard")
st.write("Transaction Monitoring")
st.table(data)