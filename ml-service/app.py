"""
ML Model Serving API - Auto-trains if no model found
"""
from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
import pickle
import os
from datetime import datetime

app = Flask(__name__)

cosine_sim = None
courses_df = None
indices = None

def load_or_train_model():
    """Load existing model or train new one"""
    global cosine_sim, courses_df, indices
    
    # Check if pre-trained model exists
    if os.path.exists('cosine_sim.pkl') and os.path.exists('courses_df.pkl'):
        print("Loading pre-trained model...")
        try:
            with open('cosine_sim.pkl', 'rb') as f:
                cosine_sim = pickle.load(f)
            courses_df = pd.read_pickle('courses_df.pkl')
            indices = pd.Series(courses_df.index, index=courses_df['course_title'])
            indices = indices[~indices.index.duplicated(keep='first')]
            print(f"✅ Model loaded! {len(courses_df)} courses available.")
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
    
    # Train new model
    print("Training new model...")
    try:
        # Check for dataset
        data_paths = ['Coursera.csv', '../dataset/Coursera.csv', 'dataset/Coursera.csv']
        data_path = None
        for path in data_paths:
            if os.path.exists(path):
                data_path = path
                break
        
        if data_path is None:
            print("❌ No dataset found. Creating sample data...")
            # Create sample course data
            sample_data = {
                'Course Name': [
                    'Machine Learning', 'Deep Learning', 'Python Programming',
                    'Data Science', 'Cloud Computing', 'Neural Networks',
                    'Natural Language Processing', 'SQL for Data Analysis',
                    'AI Fundamentals', 'Computer Vision'
                ],
                'University': [
                    'Stanford', 'DeepLearning.AI', 'UMich', 'IBM', 'AWS',
                    'Stanford', 'DeepLearning.AI', 'UC Davis', 'Google', 'MIT'
                ],
                'Difficulty Level': [
                    'Intermediate', 'Advanced', 'Beginner', 'Intermediate',
                    'Beginner', 'Advanced', 'Advanced', 'Beginner',
                    'Beginner', 'Advanced'
                ],
                'Course Rating': [4.9, 4.8, 4.8, 4.7, 4.5, 4.9, 4.6, 4.7, 4.8, 4.7],
                'Course URL': [''] * 10,
                'Course Description': [
                    'Learn ML algorithms and techniques',
                    'Deep neural networks and architectures',
                    'Programming with Python language',
                    'Data analysis and visualization',
                    'Cloud platforms and services',
                    'Neural network architectures',
                    'Text and language processing',
                    'Database query language',
                    'Artificial intelligence basics',
                    'Image recognition and processing'
                ],
                'Skills': [
                    'ML, Statistics', 'Deep Learning, CNN', 'Python, Programming',
                    'Data, Analytics', 'AWS, Cloud', 'Neural Networks, AI',
                    'NLP, Text', 'SQL, Database', 'AI, ML', 'CV, Image'
                ]
            }
            courses_df = pd.DataFrame(sample_data)
        else:
            print(f"Loading dataset from: {data_path}")
            courses_df = pd.read_csv(data_path)
        
        # Rename columns
        courses_df.rename(columns={
            'Course Name': 'course_title',
            'University': 'course_organization',
            'Difficulty Level': 'course_difficulty',
            'Course Rating': 'course_rating',
            'Course Description': 'course_description',
            'Skills': 'skills'
        }, inplace=True)
        
        # Fill missing values
        for col in ['course_title', 'course_description', 'skills']:
            if col in courses_df.columns:
                courses_df[col] = courses_df[col].fillna('')
        
        # Create combined features
        courses_df['combined_features'] = (
            courses_df['course_title'] + ' ' + 
            courses_df.get('course_description', '') + ' ' + 
            courses_df.get('skills', '')
        )
        
        # Build TF-IDF
        print("Building TF-IDF matrix...")
        tfidf = TfidfVectorizer(stop_words='english', max_features=1000)
        tfidf_matrix = tfidf.fit_transform(courses_df['combined_features'])
        
        # Compute similarity
        print("Computing cosine similarity...")
        cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)
        
        # Create indices
        indices = pd.Series(courses_df.index, index=courses_df['course_title'])
        indices = indices[~indices.index.duplicated(keep='first')]
        
        # Save model
        with open('cosine_sim.pkl', 'wb') as f:
            pickle.dump(cosine_sim, f)
        courses_df.to_pickle('courses_df.pkl')
        
        print(f"✅ Model trained! {len(courses_df)} courses available.")
        return True
        
    except Exception as e:
        print(f"❌ Error training model: {e}")
        return False

@app.route('/')
def home():
    sample = courses_df['course_title'].head(10).tolist() if courses_df is not None else []
    sample_html = ''.join([f'<li>{c}</li>' for c in sample])
    return f"""
    <h1>🎓 Course Recommendation API</h1>
    <p>Use <code>/recommend?title=CourseName</code></p>
    <p>Example: <a href="/recommend?title=Machine Learning">/recommend?title=Machine Learning</a></p>
    <p><a href="/health">Health Check</a></p>
    <h3>Sample Courses:</h3>
    <ul>{sample_html}</ul>
    """

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'Course Recommendation ML API',
        'model_loaded': courses_df is not None,
        'courses_count': len(courses_df) if courses_df is not None else 0,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/recommend', methods=['GET'])
def recommend():
    global courses_df, indices, cosine_sim
    
    course_title = request.args.get('title', '').strip()
    num = request.args.get('num', 5, type=int)
    
    if not course_title:
        return jsonify({'error': 'Please provide a course title'}), 400
    
    if num > 10: num = 10
    if num < 1: num = 1
    
    # Find course (case-insensitive)
    matched_title = None
    for title in indices.index:
        if course_title.lower() in title.lower():
            matched_title = title
            break
    
    if not matched_title:
        return jsonify({
            'error': f'Course not found',
            'sample_courses': courses_df['course_title'].head(10).tolist()
        }), 404
    
    try:
        idx = indices[matched_title]
        sim_scores = list(enumerate(cosine_sim[idx]))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        sim_scores = sim_scores[1:num+1]
        
        recommendations = []
        for i, score in sim_scores:
            course = courses_df.iloc[i]
            rec = {
                'title': str(course['course_title']),
                'similarity_score': round(score * 100, 2),
                'organization': str(course.get('course_organization', 'N/A')),
                'difficulty': str(course.get('course_difficulty', 'N/A')),
                'rating': float(course.get('course_rating', 0)) if 'course_rating' in course else 0
            }
            recommendations.append(rec)
        
        return jsonify({
            'input_course': matched_title,
            'recommendations': recommendations,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/courses')
def list_courses():
    search = request.args.get('search', '')
    if search and courses_df is not None:
        filtered = courses_df[courses_df['course_title'].str.contains(search, case=False, na=False)]
        result = filtered[['course_title']].head(20).to_dict('records')
    else:
        result = courses_df[['course_title']].head(20).to_dict('records') if courses_df is not None else []
    return jsonify({'courses': result})

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Starting Course Recommendation ML API...")
    load_or_train_model()
    port = int(os.environ.get('PORT', 5000))
    print(f"📡 Server running on port {port}")
    print("=" * 50)
    app.run(host='0.0.0.0', port=port)