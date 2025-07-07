

# Step 1: Load and inspect the datasets - Load the provided train.csv, test.csv, and sampleSubmission.csv files into pandas DataFrames and inspect their structure and contents to understand the data.

import pandas as pd

# Load the datasets
train_df = pd.read_csv('uploads/1751454956389-train.csv')
test_df = pd.read_csv('uploads/1751454956377-test.csv')
sample_submission_df = pd.read_csv('uploads/1751454956339-sampleSubmission.csv')

# Display basic information about the datasets
print("Train dataset info:")
print(train_df.info())
print("\nTrain dataset head:")
print(train_df.head())

print("\nTest dataset info:")
print(test_df.info())
print("\nTest dataset head:")
print(test_df.head())

print("\nSample submission info:")
print(sample_submission_df.info())
print("\nSample submission head:")
print(sample_submission_df.head())

# Check for missing values
print("\nMissing values in train dataset:")
print(train_df.isnull().sum())
print("\nMissing values in test dataset:")
print(test_df.isnull().sum())

# Step 2: Preprocess the data - Handle missing values, convert categorical variables into numerical representations, and prepare the data for model training.

from sklearn.preprocessing import LabelEncoder
import numpy as np

# Check for missing values again (though we already did in Step 1)
print("Missing values in train dataset before preprocessing:")
print(train_df.isnull().sum())
print("\nMissing values in test dataset before preprocessing:")
print(test_df.isnull().sum())

# Combine train and test data for consistent encoding
all_data = pd.concat([train_df.drop('ACTION', axis=1), test_df.drop('id', axis=1)], axis=0)

# Initialize label encoders for each categorical column
label_encoders = {}
categorical_cols = ['RESOURCE', 'MGR_ID', 'ROLE_ROLLUP_1', 'ROLE_ROLLUP_2', 
                    'ROLE_DEPTNAME', 'ROLE_TITLE', 'ROLE_FAMILY_DESC', 
                    'ROLE_FAMILY', 'ROLE_CODE']

# Apply label encoding to each categorical column
for col in categorical_cols:
    le = LabelEncoder()
    # Fit on all data to handle all possible categories
    all_data[col] = le.fit_transform(all_data[col].astype(str))
    label_encoders[col] = le

# Split back into train and test
train_processed = all_data[:len(train_df)]
test_processed = all_data[len(train_df):]

# Add back the target variable to train data
train_processed['ACTION'] = train_df['ACTION']

# Prepare features and target
X = train_processed.drop('ACTION', axis=1)
y = train_processed['ACTION']
X_test = test_processed.copy()

# Verify the shapes
print("\nShapes after preprocessing:")
print(f"X shape: {X.shape}")
print(f"y shape: {y.shape}")
print(f"X_test shape: {X_test.shape}")

# Check the first few rows of processed data
print("\nProcessed train data head:")
print(X.head())
print("\nProcessed test data head:")
print(X_test.head())

# Step 3: Feature engineering - Create new features from existing ones if necessary, such as combining related columns or extracting meaningful information from categorical variables.

# Create interaction features between important categorical variables
def create_interaction_features(df):
    # Interaction between ROLE_ROLLUP_1 and ROLE_ROLLUP_2
    df['ROLLUP1_ROLLUP2'] = df['ROLE_ROLLUP_1'].astype(str) + '_' + df['ROLE_ROLLUP_2'].astype(str)
    
    # Interaction between ROLE_DEPTNAME and ROLE_FAMILY
    df['DEPT_FAMILY'] = df['ROLE_DEPTNAME'].astype(str) + '_' + df['ROLE_FAMILY'].astype(str)
    
    # Interaction between ROLE_TITLE and ROLE_CODE
    df['TITLE_CODE'] = df['ROLE_TITLE'].astype(str) + '_' + df['ROLE_CODE'].astype(str)
    
    return df

# Apply feature engineering to both train and test data
X = create_interaction_features(X)
X_test = create_interaction_features(X_test)

# Label encode the new interaction features
for col in ['ROLLUP1_ROLLUP2', 'DEPT_FAMILY', 'TITLE_CODE']:
    le = LabelEncoder()
    # Combine train and test for consistent encoding
    combined = pd.concat([X[col], X_test[col]], axis=0)
    le.fit(combined)
    X[col] = le.transform(X[col])
    X_test[col] = le.transform(X_test[col])

# Create count features for each categorical variable
for col in categorical_cols:
    # Get counts from training data only to avoid data leakage
    count_map = X[col].value_counts().to_dict()
    X[col+'_count'] = X[col].map(count_map)
    X_test[col+'_count'] = X_test[col].map(count_map).fillna(1)  # Fill unseen categories with 1

# Verify the new features
print("\nNew features in train data:")
print(X[['ROLLUP1_ROLLUP2', 'DEPT_FAMILY', 'TITLE_CODE', 'RESOURCE_count']].head())
print("\nNew features in test data:")
print(X_test[['ROLLUP1_ROLLUP2', 'DEPT_FAMILY', 'TITLE_CODE', 'RESOURCE_count']].head())

# Check the final shapes
print("\nFinal shapes after feature engineering:")
print(f"X shape: {X.shape}")
print(f"X_test shape: {X_test.shape}")

# Step 4: Split the training data - Separate the training data into features (X) and target variable (y), where y is the ACTION column indicating whether access was approved or not.

# The features (X) and target (y) were already prepared in Step 2 and enhanced in Step 3
# Here we'll just verify the shapes and do a train-validation split for model evaluation

from sklearn.model_selection import train_test_split

# Verify the shapes of X and y
print("Final feature matrix shape:", X.shape)
print("Target variable shape:", y.shape)

# Split into training and validation sets (80-20 split)
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Print the shapes of the splits
print("\nTraining set shapes:")
print("X_train:", X_train.shape)
print("y_train:", y_train.shape)

print("\nValidation set shapes:")
print("X_val:", X_val.shape)
print("y_val:", y_val.shape)

# Check the class distribution in each split
print("\nClass distribution in full dataset:")
print(y.value_counts(normalize=True))

print("\nClass distribution in training set:")
print(y_train.value_counts(normalize=True))

print("\nClass distribution in validation set:")
print(y_val.value_counts(normalize=True))

# The test data (X_test) was already prepared in previous steps
print("\nTest data shape:")
print(X_test.shape)

# Step 5: Train a machine learning model - Select an appropriate model (e.g., Random Forest, Gradient Boosting, or Logistic Regression) and train it on the preprocessed training data.

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score
import time

# Initialize the Random Forest classifier
rf_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_split=5,
    min_samples_leaf=2,
    max_features='sqrt',
    random_state=42,
    n_jobs=-1,
    verbose=1
)

# Train the model
print("Training Random Forest model...")
start_time = time.time()
rf_model.fit(X_train, y_train)
training_time = time.time() - start_time
print(f"Training completed in {training_time:.2f} seconds")

# Make predictions on validation set
val_preds = rf_model.predict_proba(X_val)[:, 1]

# Calculate ROC AUC score
val_auc = roc_auc_score(y_val, val_preds)
print(f"Validation ROC AUC Score: {val_auc:.4f}")

# Feature importance
feature_importance = pd.DataFrame({
    'Feature': X.columns,
    'Importance': rf_model.feature_importances_
}).sort_values('Importance', ascending=False)

print("\nTop 10 most important features:")
print(feature_importance.head(10))

# Train final model on all training data
print("\nTraining final model on all training data...")
final_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_split=5,
    min_samples_leaf=2,
    max_features='sqrt',
    random_state=42,
    n_jobs=-1,
    verbose=1
)

final_model.fit(X, y)

# Make predictions on test set
test_preds = final_model.predict_proba(X_test)[:, 1]

# Prepare submission file
submission = pd.DataFrame({
    'id': test_df['id'],
    'ACTION': test_preds
})

# Save submission file
submission_path = '../submission_folder/Amazon.com_-_Employee_Access_Challenge_submission.csv'
submission.to_csv(submission_path, index=False)
print(f"\nSubmission file saved to: {submission_path}")

# Step 6: Make predictions on the test set - Use the trained model to predict probabilities for the test set, ensuring the output format matches the submission requirements.

# Make predictions on the test set using the final model trained in Step 5
test_preds = final_model.predict_proba(X_test)[:, 1]

# Prepare submission file with the required format
submission = pd.DataFrame({
    'id': test_df['id'],
    'ACTION': test_preds
})

# Ensure the ACTION column contains probabilities between 0 and 1
submission['ACTION'] = submission['ACTION'].clip(0, 1)

# Save submission file to the specified path
submission_path = '../submission_folder/Amazon.com_-_Employee_Access_Challenge_submission.csv'
submission.to_csv(submission_path, index=False)

print(f"Submission file successfully saved to {submission_path}")
print("\nSubmission file preview:")
print(submission.head())

# Step 7: Generate the submission file - Create a CSV file named Amazon.com_-_Employee_Access_Challenge_submission.csv with the required columns (id and ACTION) and save it to the specified submission folder.

import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
import numpy as np

# Step 1: Load and inspect the datasets
train_df = pd.read_csv('uploads/1751454956389-train.csv')
test_df = pd.read_csv('uploads/1751454956377-test.csv')

# Step 2: Preprocess the data
# Combine train and test data for consistent encoding
all_data = pd.concat([train_df.drop('ACTION', axis=1), test_df.drop('id', axis=1)], axis=0)

# Initialize label encoders for each categorical column
label_encoders = {}
categorical_cols = ['RESOURCE', 'MGR_ID', 'ROLE_ROLLUP_1', 'ROLE_ROLLUP_2', 
                   'ROLE_DEPTNAME', 'ROLE_TITLE', 'ROLE_FAMILY_DESC', 
                   'ROLE_FAMILY', 'ROLE_CODE']

# Apply label encoding to each categorical column
for col in categorical_cols:
    le = LabelEncoder()
    all_data[col] = le.fit_transform(all_data[col].astype(str))
    label_encoders[col] = le

# Split back into train and test
train_processed = all_data[:len(train_df)]
test_processed = all_data[len(train_df):]

# Add back the target variable to train data
train_processed['ACTION'] = train_df['ACTION']

# Step 3: Feature engineering
def create_interaction_features(df):
    df['ROLLUP1_ROLLUP2'] = df['ROLE_ROLLUP_1'].astype(str) + '_' + df['ROLE_ROLLUP_2'].astype(str)
    df['DEPT_FAMILY'] = df['ROLE_DEPTNAME'].astype(str) + '_' + df['ROLE_FAMILY'].astype(str)
    df['TITLE_CODE'] = df['ROLE_TITLE'].astype(str) + '_' + df['ROLE_CODE'].astype(str)
    return df

X = create_interaction_features(train_processed.drop('ACTION', axis=1))
y = train_processed['ACTION']
X_test = create_interaction_features(test_processed)

# Label encode the new interaction features
for col in ['ROLLUP1_ROLLUP2', 'DEPT_FAMILY', 'TITLE_CODE']:
    le = LabelEncoder()
    combined = pd.concat([X[col], X_test[col]], axis=0)
    le.fit(combined)
    X[col] = le.transform(X[col])
    X_test[col] = le.transform(X_test[col])

# Create count features for each categorical variable
for col in categorical_cols:
    count_map = X[col].value_counts().to_dict()
    X[col+'_count'] = X[col].map(count_map)
    X_test[col+'_count'] = X_test[col].map(count_map).fillna(1)

# Step 4: Split the training data
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Step 5: Train a machine learning model
rf_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_split=5,
    min_samples_leaf=2,
    max_features='sqrt',
    random_state=42,
    n_jobs=-1
)

rf_model.fit(X_train, y_train)

# Evaluate on validation set
val_preds = rf_model.predict_proba(X_val)[:, 1]
val_auc = roc_auc_score(y_val, val_preds)
print(f"Validation ROC AUC Score: {val_auc:.4f}")

# Train final model on all training data
final_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_split=5,
    min_samples_leaf=2,
    max_features='sqrt',
    random_state=42,
    n_jobs=-1
)
final_model.fit(X, y)

# Step 6 & 7: Make predictions and generate submission file
test_preds = final_model.predict_proba(X_test)[:, 1]

submission = pd.DataFrame({
    'id': test_df['id'],
    'ACTION': test_preds
})

# Ensure probabilities are between 0 and 1
submission['ACTION'] = submission['ACTION'].clip(0, 1)

# Save submission file
submission_path = '../submission_folder/Amazon.com_-_Employee_Access_Challenge_submission.csv'
submission.to_csv(submission_path, index=False)
print(f"Submission file saved to: {submission_path}")

# Step 8: Verify the submission file - Check that the submission file is correctly formatted and contains the appropriate predictions before finalizing.

# Load the generated submission file to verify its contents
submission_path = '../submission_folder/Amazon.com_-_Employee_Access_Challenge_submission.csv'
submission = pd.read_csv(submission_path)

# Check the file structure
print("Submission file info:")
print(submission.info())

# Check the first few rows
print("\nSubmission file head:")
print(submission.head())

# Check the last few rows
print("\nSubmission file tail:")
print(submission.tail())

# Verify the id column matches test.csv ids
print("\nVerifying ids match test.csv:")
print("All test ids present:", set(test_df['id']).issubset(set(submission['id'])))
print("Number of rows match:", len(submission) == len(test_df))

# Check prediction values range
print("\nPrediction values summary:")
print(submission['ACTION'].describe())

# Verify no missing values
print("\nMissing values check:")
print(submission.isnull().sum())

# Verify file was saved correctly
import os
print(f"\nFile exists at path: {os.path.exists(submission_path)}")
print(f"File size: {os.path.getsize(submission_path)} bytes")

# Final confirmation
print("\nSubmission file verification complete. File is ready for submission.")