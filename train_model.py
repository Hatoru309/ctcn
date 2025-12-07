import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import SVC
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import LabelEncoder
import joblib
import re

# Load the dataset
print("Loading dataset...")
df = pd.read_csv('training_dataset.csv')

# Clean the data
print("Cleaning data...")
# Remove rows with empty labels
df = df[df['Label'].notna() & (df['Label'].str.strip() != '')]

# Fix typos in labels (e.g., "Citical" -> "Critical")
df['Label'] = df['Label'].str.strip()
df['Label'] = df['Label'].replace('Citical', 'Critical')

# Get messages and labels
messages = df['Message'].astype(str)
labels = df['Label']

# Encode labels to numeric values
label_encoder = LabelEncoder()
y = label_encoder.fit_transform(labels)

print(f"Dataset shape: {df.shape}")
print(f"Label distribution:\n{df['Label'].value_counts()}")
print(f"\nUnique labels: {label_encoder.classes_}")

# Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(
    messages, y, test_size=0.2, random_state=42, stratify=y
)

print(f"\nTraining set size: {len(X_train)}")
print(f"Test set size: {len(X_test)}")

# Text preprocessing and feature extraction using TF-IDF
print("\nExtracting features using TF-IDF...")
vectorizer = TfidfVectorizer(
    max_features=5000,
    ngram_range=(1, 2),  # Use unigrams and bigrams
    min_df=2,  # Minimum document frequency
    max_df=0.95,  # Maximum document frequency
    lowercase=True,
    strip_accents='unicode'
)

X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)

print(f"Feature matrix shape: {X_train_tfidf.shape}")

# Train SVM model
print("\nTraining SVM model...")
svm_model = SVC(
    kernel='rbf',  # Radial Basis Function kernel
    C=1.0,  # Regularization parameter
    gamma='scale',  # Kernel coefficient
    probability=True,  # Enable probability estimates
    random_state=42
)

svm_model.fit(X_train_tfidf, y_train)

# Make predictions
print("\nMaking predictions...")
y_pred = svm_model.predict(X_test_tfidf)

# Evaluate the model
print("\n" + "="*50)
print("MODEL EVALUATION")
print("="*50)

accuracy = accuracy_score(y_test, y_pred)
print(f"\nAccuracy: {accuracy:.4f}")

print("\nClassification Report:")
print(classification_report(
    y_test, 
    y_pred, 
    target_names=label_encoder.classes_
))

print("\nConfusion Matrix:")
cm = confusion_matrix(y_test, y_pred)
print(cm)

# Save the model and vectorizer
print("\nSaving model and vectorizer...")
joblib.dump(svm_model, 'svm_model.pkl')
joblib.dump(vectorizer, 'tfidf_vectorizer.pkl')
joblib.dump(label_encoder, 'label_encoder.pkl')

print("Model saved successfully!")
print("\nFiles created:")
print("  - svm_model.pkl")
print("  - tfidf_vectorizer.pkl")
print("  - label_encoder.pkl")

# Test prediction function
def predict_label(message):
    """Function to predict label for a new message"""
    # Input validation: Check if message is valid
    if not message or not isinstance(message, str):
        return "Low", 1.0, {"Low": 1.0}
    
    # Clean the message
    cleaned_message = message.strip()
    
    # Check if message is only numbers or too short to be meaningful
    if not cleaned_message or len(cleaned_message) < 3:
        return "Low", 1.0, {"Low": 1.0}
    
    # Check if message contains only digits (like "123123123")
    if cleaned_message.isdigit():
        return "Low", 1.0, {"Low": 1.0}
    
    # Check if message has at least some alphabetic characters
    if not any(c.isalpha() for c in cleaned_message):
        return "Low", 1.0, {"Low": 1.0}
    
    message_tfidf = vectorizer.transform([cleaned_message])
    prediction = svm_model.predict(message_tfidf)
    probability = svm_model.predict_proba(message_tfidf)[0]
    
    predicted_label = label_encoder.inverse_transform(prediction)[0]
    confidence = probability[prediction[0]]
    
    return predicted_label, confidence, dict(zip(label_encoder.classes_, probability))

# Test with a few examples
print("\n" + "="*50)
print("TEST PREDICTIONS")
print("="*50)

test_messages = [
    "Nhà tôi bị ngập rồi, tôi cần phải di chuyển đến nơi an toàn hơn",
    "Tôi bị thương nặng, tôi cần cấp cứu",
    "Mất điện rồi, tôi cần đèn pin",
    "Tôi đang tát nước ra khỏi nhà",
    "123123123",
    "333333333333"
]

for msg in test_messages:
    pred_label, confidence, probs = predict_label(msg)
    print(f"\nMessage: {msg}")
    print(f"Predicted Label: {pred_label} (Confidence: {confidence:.4f})")
    print(f"Probabilities: {probs}")

