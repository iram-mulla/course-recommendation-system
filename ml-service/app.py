"""
ML Model Serving API using Flask
This provides the recommendation API endpoint
"""
from flask import Flask, request, jsonify, render_template_string
import pandas as pd
import pickle
import os
from datetime import datetime

app = Flask(__name__)

# Global variables for model artifacts
tfidf = None
cosine_sim = None
courses_df = None
indices = None

def load_model():
    """Load the trained model artifacts"""
    global tfidf, cosine_sim, courses_df, indices
    
    print("Loading model artifacts...")
    
    try:
        with open('tfidf_vectorizer.pkl', 'rb') as f:
            tfidf = pickle.load(f)
        
        with open('cosine_sim.pkl', 'rb') as f:
            cosine_sim = pickle.load(f)
        
        courses_df = pd.read_pickle('courses_df.pkl')
        
        # Handle duplicate course titles
        indices = pd.Series(courses_df.index, index=courses_df['course_title'])
        # Keep only first occurrence of each course title
        indices = indices[~indices.index.duplicated(keep='first')]
        
        print(f"Model loaded successfully! {len(courses_df)} courses available.")
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        return False

def find_course(course_title):
    """Find course by title (case-insensitive)"""
    # Exact match first
    if course_title in indices:
        return course_title
    
    # Case-insensitive search
    matching = courses_df[courses_df['course_title'].str.contains(
        course_title, case=False, na=False, regex=False
    )]
    
    if not matching.empty:
        return matching['course_title'].iloc[0]
    
    return None

def get_recommendations(course_title, num_recommendations=5):
    """
    Get course recommendations based on content similarity
    """
    # Try to find the course
    found_title = find_course(course_title)
    
    if found_title is None:
        return {
            'error': f'Course "{course_title}" not found',
            'suggestion': 'Try searching with a different term',
            'available_courses': courses_df['course_title'].head(20).tolist()
        }
    
    try:
        # Get the index of the course
        idx = indices[found_title]
        
        # Get similarity scores
        sim_scores = list(enumerate(cosine_sim[idx]))
        
        # Sort by similarity score
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        
        # Get top N recommendations (excluding the course itself)
        sim_scores = sim_scores[1:num_recommendations+1]
        
        # Get course indices
        course_indices = [i[0] for i in sim_scores]
        similarity_scores = [round(i[1] * 100, 2) for i in sim_scores]
        
        # Get course details
        recommendations = []
        for idx_val, score in zip(course_indices, similarity_scores):
            course = courses_df.iloc[idx_val]
            recommendation = {
                'title': str(course['course_title']),
                'similarity_score': score,
                'organization': str(course.get('course_organization', 'N/A')),
                'difficulty': str(course.get('course_difficulty', 'N/A')),
                'rating': float(course.get('course_rating', 0)) if pd.notna(course.get('course_rating', 0)) else 0
            }
            recommendations.append(recommendation)
        
        return {
            'input_course': found_title,
            'recommendations': recommendations,
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        return {
            'error': f'Error generating recommendations: {str(e)}',
            'input_course': course_title
        }

# HTML Template for the API home page
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Course Recommendation API</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 10px;
        }
        .endpoint {
            background-color: #f9f9f9;
            padding: 15px;
            border-left: 4px solid #4CAF50;
            margin: 20px 0;
        }
        code {
            background-color: #eee;
            padding: 2px 6px;
            border-radius: 3px;
        }
        .sample {
            background-color: #e8f5e9;
            padding: 10px;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎓 Course Recommendation ML API</h1>
        <p>Welcome to the Course Recommendation System API</p>
        
        <div class="endpoint">
            <h3>API Endpoint</h3>
            <p><strong>GET</strong> <code>/recommend?title=CourseName</code></p>
            <p><strong>Example:</strong></p>
            <div class="sample">
                <code>/recommend?title=Machine%20Learning</code>
            </div>
            <p><strong>Optional parameter:</strong> <code>num</code> (number of recommendations, default=5)</p>
        </div>
        
        <div class="endpoint">
            <h3>Available Courses (Sample)</h3>
            <ul>
                {% for course in sample_courses %}
                <li>{{ course }}</li>
                {% endfor %}
            </ul>
        </div>
        
        <div class="endpoint">
            <h3>Health Check</h3>
            <p><strong>GET</strong> <code>/health</code></p>
        </div>
    </div>
</body>
</html>
"""

@app.route('/')
def home():
    """Home page with API documentation"""
    sample_courses = []
    if courses_df is not None:
        sample_courses = courses_df['course_title'].head(10).tolist()
    return render_template_string(HTML_TEMPLATE, sample_courses=sample_courses)

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Course Recommendation ML API',
        'model_loaded': courses_df is not None,
        'courses_count': len(courses_df) if courses_df is not None else 0,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/recommend', methods=['GET'])
def recommend():
    """
    Get course recommendations
    Query parameters:
        title (required): Course title to base recommendations on
        num (optional): Number of recommendations (default=5, max=10)
    """
    # Get parameters
    course_title = request.args.get('title')
    num_recommendations = request.args.get('num', 5, type=int)
    
    # Validate input
    if not course_title:
        return jsonify({
            'error': 'Please provide a course title',
            'usage': '/recommend?title=CourseName&num=5'
        }), 400
    
    if num_recommendations > 10:
        num_recommendations = 10
    elif num_recommendations < 1:
        num_recommendations = 1
    
    # Get recommendations
    result = get_recommendations(course_title, num_recommendations)
    
    if 'error' in result:
        return jsonify(result), 404
    
    return jsonify(result)

@app.route('/courses', methods=['GET'])
def list_courses():
    """List all available courses"""
    if courses_df is None:
        return jsonify({'error': 'Model not loaded'}), 500
    
    # Get search query
    search = request.args.get('search', '')
    
    if search:
        filtered = courses_df[courses_df['course_title'].str.contains(search, case=False, na=False)]
        # Select only existing columns
        available_cols = [col for col in ['course_title', 'course_organization', 'course_difficulty', 'course_rating'] 
                         if col in filtered.columns]
        courses_list = filtered[available_cols].head(50).to_dict('records')
    else:
        available_cols = [col for col in ['course_title', 'course_organization', 'course_difficulty', 'course_rating'] 
                         if col in courses_df.columns]
        courses_list = courses_df[available_cols].head(50).to_dict('records')
    
    return jsonify({
        'total_courses': len(courses_list),
        'courses': courses_list
    })

if __name__ == '__main__':
    # Load model
    load_model()
    
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    print(f"\n{'='*50}")
    print(f"ML Service starting on port {port}")
    print(f"Debug mode: {debug}")
    print(f"API Documentation: http://localhost:{port}/")
    print(f"Health Check: http://localhost:{port}/health")
    print(f"Recommendations: http://localhost:{port}/recommend?title=Machine%20Learning")
    print(f"{'='*50}\n")
    
    app.run(host='0.0.0.0', port=port, debug=debug)