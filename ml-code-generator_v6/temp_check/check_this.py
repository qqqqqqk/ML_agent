

# Step 1: Load the dataset  
# Description: Read the iris.csv file into a pandas DataFrame to begin data processing and analysis.

import pandas as pd

# Load the dataset
df = pd.read_csv('uploads/1750776811933-iris.csv')

# Display the first few rows to verify loading
df.head()

# Step 2: Explore the dataset

# Check the structure of the dataset
print("Dataset shape:", df.shape)

# Display basic information about the dataset
print("\nDataset info:")
print(df.info())

# Show summary statistics for numerical columns
print("\nSummary statistics:")
print(df.describe())

# Check for missing values
print("\nMissing values count:")
print(df.isnull().sum())

# Check class distribution if it's a classification problem
if 'species' in df.columns:
    print("\nClass distribution:")
    print(df['species'].value_counts())