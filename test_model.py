import joblib
import numpy as np

# Load the saved model, vectorizer, and label encoder
print("Loading model and preprocessing components...")
svm_model = joblib.load('svm_model.pkl')
vectorizer = joblib.load('tfidf_vectorizer.pkl')
label_encoder = joblib.load('label_encoder.pkl')

print("Model loaded successfully!")

def predict_label(message):
    """
    Predict the label for a given message.
    
    Args:
        message (str): Input message to classify
        
    Returns:
        tuple: (predicted_label, confidence, probabilities_dict)
            - predicted_label: The predicted label (str)
            - confidence: Confidence score for the prediction (float)
            - probabilities_dict: Dictionary with probabilities for all labels
    """
    # Transform the message using TF-IDF vectorizer
    message_tfidf = vectorizer.transform([message])
    
    # Make prediction
    prediction = svm_model.predict(message_tfidf)
    
    # Get probability estimates
    probability = svm_model.predict_proba(message_tfidf)[0]
    
    # Decode the predicted label
    predicted_label = label_encoder.inverse_transform(prediction)[0]
    
    # Get confidence (probability of predicted class)
    confidence = probability[prediction[0]]
    
    # Create dictionary mapping labels to probabilities
    probabilities_dict = dict(zip(label_encoder.classes_, probability))
    
    return predicted_label, confidence, probabilities_dict

def predict_batch(messages):
    """
    Predict labels for multiple messages.
    
    Args:
        messages (list): List of input messages to classify
        
    Returns:
        list: List of tuples, each containing (predicted_label, confidence, probabilities_dict)
    """
    results = []
    for message in messages:
        result = predict_label(message)
        results.append(result)
    return results

# Example usage
if __name__ == "__main__":
    # Test with a single message
    test_message = "tui cần tìm động vật của nhè"
    
    print("\n" + "="*50)
    print("TEST PREDICTION")
    print("="*50)
    print(f"\nInput message: {test_message}")
    
    predicted_label, confidence, probabilities = predict_label(test_message)
    
    print(f"\nPredicted Label: {predicted_label}")
    print(f"Confidence: {confidence:.4f}")
    print(f"\nAll Probabilities:")
    for label, prob in sorted(probabilities.items(), key=lambda x: x[1], reverse=True):
        print(f"  {label}: {prob:.4f}")

