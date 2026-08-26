import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, precision_recall_fscore_support, confusion_matrix
import joblib
from preprocess import preprocess_dataframe

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "model"))
MODEL_PATH = os.path.join(MODEL_DIR, "random_forest.joblib")

def bootstrap_data() -> pd.DataFrame:
    """
    Generates a clean synthetic dataset for model bootstrapping on first run.
    """
    np.random.seed(42)
    size = 2000
    
    # Pre-generate coordinates around Mumbai Dadar/Bandra/Kurla/Andheri/Borivali
    atms = ["ATM-Z03", "ATM-Z11", "ATM-Z07", "ATM-Z09", "ATM-Z05"]
    categories = [
        "Part-Time Task Scam", "Lottery Gift Card Scam", "Utility Bill Fraud", "Dating App Scam", 
        "Crypto Investment Fraud", "Tech Support Extortion", "SMS Phishing Attack", "Identity Theft", 
        "Fake E-Commerce Store", "Vishing Blackmail", "Credit Card Cloning", "Sextortion Blackmail",
        "Fake Travel Booking", "Real Estate Lease Fraud", "Customs Clearance Impersonation",
        "UPI Social Engineering", "Fake Investment Scam", "Loan Scam", 
        "Multiple Victims Convergence", "Transaction Splitting"
    ]
    states = ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Telangana"]
    
    data = {
        "amount": np.random.uniform(5000, 200000, size),
        "hour": np.random.randint(0, 24, size),
        "day_of_week": np.random.randint(0, 7, size),
        "category": np.random.choice(categories, size),
        "state": np.random.choice(states, size),
        "source_lat": np.random.uniform(18.9, 19.3, size),
        "source_lng": np.random.uniform(72.7, 73.0, size),
        # ATM mapping patterns
        "atm_id": np.random.choice(atms, size)
    }
    
    # Introduce explicit patterns for classification learning
    df = pd.DataFrame(data)
    for idx, row in df.iterrows():
        # E.g. high amounts & UPI fraud in Maharashtra map to ATM-Z03 (Dadar)
        if row['amount'] > 120000 and row['category'] == "UPI Social Engineering":
            df.at[idx, 'atm_id'] = "ATM-Z03"
        # Late night investments in Karnataka map to ATM-Z11
        elif row['hour'] > 20 and row['state'] == "Karnataka":
            df.at[idx, 'atm_id'] = "ATM-Z11"
        # Task scams during the day map to ATM-Z07 (Kurla)
        elif row['hour'] in [10, 11, 12, 13] and row['category'] == "Part-Time Task Scam":
            df.at[idx, 'atm_id'] = "ATM-Z07"
            
    return df

def train_model(csv_path: str = None) -> dict:
    """
    Trains the Random Forest model and saves it. Returns accuracy metrics.
    """
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)
        
    if csv_path and os.path.exists(csv_path):
        print(f"Loading training data from {csv_path}")
        df = pd.read_csv(csv_path)
    else:
        print("No CSV provided or found. Bootstrapping synthetic dataset...")
        df = bootstrap_data()
        
    features, target = preprocess_dataframe(df)
    
    # Proper train/test split
    X_train, X_test, y_train, y_test = train_test_split(features, target, test_size=0.2, random_state=42)
    
    clf = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
    clf.fit(X_train, y_train)
    
    # Save the model
    joblib.dump(clf, MODEL_PATH)
    print(f"Model saved successfully to {MODEL_PATH}")
    
    # Evaluation
    predictions = clf.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    
    # Get precision, recall, f1
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, predictions, average='macro', zero_division=0)
    
    # Confusion matrix
    conf_mat = confusion_matrix(y_test, predictions)
    
    # Unique classes
    classes = clf.classes_.tolist()
    
    metrics = {
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "classes": classes,
        "confusion_matrix": conf_mat.tolist()
    }
    
    # Save metrics log
    metrics_path = os.path.join(MODEL_DIR, "metrics.joblib")
    joblib.dump(metrics, metrics_path)
    
    return metrics

if __name__ == "__main__":
    train_model()
