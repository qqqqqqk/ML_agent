

# Step 1: Load the dataset  
# Description: Read the CSV file containing the iris dataset into a pandas DataFrame for further processing.

import pandas as pd

# Load the iris dataset from CSV file
df = pd.read_csv('uploads/1751347134787-1750954033139-iris.csv')

# Step 2: Preprocess the data

# Check for missing values
df = df.dropna()

# Separate features and target variable
X = df.drop('species', axis=1)  # Features (all columns except 'species')
y = df['species']  # Target variable

# No categorical encoding needed as all features are numerical
# and target is already categorical (will be handled by RandomForestClassifier)

# Step 3: Split the dataset
from sklearn.model_selection import train_test_split

# Split the data into training and testing sets (80% train, 20% test)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Step 4: Initialize the Random Forest classifier
from sklearn.ensemble import RandomForestClassifier

# Create Random Forest classifier instance with default parameters
rf_classifier = RandomForestClassifier(random_state=42)

# Step 5: Train the model
rf_classifier.fit(X_train, y_train)

# Step 6: Make predictions
y_pred = rf_classifier.predict(X_test)

# Step 7: Evaluate the model
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

# Calculate accuracy
accuracy = accuracy_score(y_test, y_pred)

# Generate classification report
class_report = classification_report(y_test, y_pred)

# Generate confusion matrix
conf_matrix = confusion_matrix(y_test, y_pred)

# Print evaluation metrics
print(f"Accuracy: {accuracy:.4f}")
print("\nClassification Report:")
print(class_report)
print("\nConfusion Matrix:")
print(conf_matrix)