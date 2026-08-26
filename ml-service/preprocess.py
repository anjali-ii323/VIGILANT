import pandas as pd
import numpy as np

CRIME_CATEGORIES = [
    "Part-Time Task Scam", "Lottery Gift Card Scam", "Utility Bill Fraud", "Dating App Scam", 
    "Crypto Investment Fraud", "Tech Support Extortion", "SMS Phishing Attack", "Identity Theft", 
    "Fake E-Commerce Store", "Vishing Blackmail", "Credit Card Cloning", "Sextortion Blackmail",
    "Fake Travel Booking", "Real Estate Lease Fraud", "Customs Clearance Impersonation",
    "UPI Social Engineering", "Fake Investment Scam", "Loan Scam", 
    "Multiple Victims Convergence", "Transaction Splitting"
]

STATES = [
    "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Telangana", 
    "Uttar Pradesh", "West Bengal", "Gujarat", "Rajasthan", "Madhya Pradesh"
]

def encode_category(category: str) -> int:
    try:
        return CRIME_CATEGORIES.index(category)
    except ValueError:
        return len(CRIME_CATEGORIES)  # Default fallback code

def encode_state(state: str) -> int:
    try:
        return STATES.index(state)
    except ValueError:
        return len(STATES)

def preprocess_features(amount: float, hour: int, day_of_week: int, category: str, state: str, source_lat: float, source_lng: float) -> np.ndarray:
    """
    Converts raw query attributes into an array suitable for model prediction.
    """
    cat_code = encode_category(category)
    state_code = encode_state(state)
    
    # Return as single row feature matrix
    return np.array([[
        amount, 
        float(hour), 
        float(day_of_week), 
        float(cat_code), 
        float(state_code), 
        source_lat, 
        source_lng
    ]])

def preprocess_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """
    Processes dataframe for training model.
    """
    df['category_code'] = df['category'].apply(encode_category)
    df['state_code'] = df['state'].apply(encode_state)
    
    features = df[[
        'amount', 
        'hour', 
        'day_of_week', 
        'category_code', 
        'state_code', 
        'source_lat', 
        'source_lng'
    ]]
    
    target = df['atm_id']
    return features, target
