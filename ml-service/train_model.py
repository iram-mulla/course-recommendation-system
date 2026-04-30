"""
ML Model Training Script
This script trains a course recommendation model using TF-IDF and Cosine Similarity
"""
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
import pickle
import os
import sys

def train_model(data_path='Coursera.csv'):
    """
    Train the recommendation model
    """
    print("=" * 50)
    print("Starting Model Training Process")
    print("=" * 50)
    
    # Check if dataset exists
    if not os.path.exists(data_path):
        print(f"Error: Dataset not found at {data_path}!")
        print("Please make sure Coursera.csv is in the dataset folder")
        sys.exit(1)
    
    print(f"Loading dataset from: {data_path}")
    
    # Load Dataset
    try:
        df = pd.read_csv(data_path)
        print(f"Dataset loaded successfully. Shape: {df.shape}")
        print(f"Columns: {list(df.columns)}")
    except Exception as e:
        print(f"Error loading dataset: {e}")
        sys.exit(1)
    
    # YOUR DATASET HAS DIFFERENT COLUMN NAMES:
    # 'Course Name', 'University', 'Difficulty Level', 'Course Rating', 
    # 'Course URL', 'Course Description', 'Skills'
    
    # Rename columns for easier use in our code
    df.rename(columns={
        'Course Name': 'course_title',
        'University': 'course_organization',
        'Difficulty Level': 'course_difficulty',
        'Course Rating': 'course_rating',
        'Course Description': 'course_description',
        'Skills': 'skills'
    }, inplace=True)
    
    print(f"Renamed columns: {list(df.columns)}")
    
    # Handle missing values
    df['course_title'] = df['course_title'].fillna('')
    df['course_description'] = df['course_description'].fillna('')
    
    # Create a combined text field for better recommendations
    df['combined_features'] = df['course_title'] + ' ' + df['course_description'] + ' ' + df['skills'].fillna('')
    
    # Convert difficulty to numerical for additional features
    difficulty_map = {'Beginner': 1, 'Intermediate': 2, 'Advanced': 3, 'Mixed': 2}
    if 'course_difficulty' in df.columns:
        df['difficulty_score'] = df['course_difficulty'].map(difficulty_map).fillna(2)
        print(f"Difficulty levels found: {df['course_difficulty'].unique()}")
    
    print("\nBuilding TF-IDF Matrix...")
    print(f"Using combined features (title + description + skills)")
    
    # Create TF-IDF Vectorizer
    tfidf = TfidfVectorizer(
        stop_words='english',
        max_features=5000,
        ngram_range=(1, 2)
    )
    
    # Transform course features
    tfidf_matrix = tfidf.fit_transform(df['combined_features'])
    print(f"TF-IDF Matrix shape: {tfidf_matrix.shape}")
    
    print("\nComputing Cosine Similarity...")
    # Compute similarity matrix
    cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)
    print(f"Similarity Matrix shape: {cosine_sim.shape}")
    
    print("\nSaving model artifacts...")
    # Save all model artifacts
    with open('tfidf_vectorizer.pkl', 'wb') as f:
        pickle.dump(tfidf, f)
        print("✓ TF-IDF Vectorizer saved")
    
    with open('cosine_sim.pkl', 'wb') as f:
        pickle.dump(cosine_sim, f)
        print("✓ Cosine Similarity Matrix saved")
    
    df.to_pickle('courses_df.pkl')
    print("✓ Course DataFrame saved")
    
    # Display sample recommendations
    print("\n" + "=" * 50)
    print("Testing Model with Sample Recommendations")
    print("=" * 50)
    
    indices = pd.Series(df.index, index=df['course_title']).drop_duplicates()
    
    # Test with first 3 courses
    for i in range(min(3, len(df))):
        test_course = df['course_title'].iloc[i]
        try:
            idx = indices[test_course]
            sim_scores = list(enumerate(cosine_sim[idx]))
            sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
            sim_scores = sim_scores[1:4]  # Top 3 recommendations
            
            course_indices = [i[0] for i in sim_scores]
            recommendations = df['course_title'].iloc[course_indices].tolist()
            
            print(f"\nIf you like: {test_course}")
            print("Recommendations:")
            for j, rec in enumerate(recommendations, 1):
                print(f"  {j}. {rec}")
        except Exception as e:
            print(f"Could not test for: {test_course} - {e}")
    
    print("\n" + "=" * 50)
    print(f"Model Training Completed Successfully!")
    print(f"Total courses processed: {len(df)}")
    print("=" * 50)
    
    return df, cosine_sim

if __name__ == "__main__":
    train_model()