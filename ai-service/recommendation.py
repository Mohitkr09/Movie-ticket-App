import os
import pandas as pd
import requests
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import time
from functools import lru_cache
import logging
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import hashlib
import json
import re
from datetime import datetime, timedelta
import random
from textblob import TextBlob
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

# Download NLTK data
try:
    nltk.download('vader_lexicon', quiet=True)
except:
    pass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
TMDB_API_KEY = os.getenv("TMDB_API_KEY")

if not TMDB_API_KEY:
    raise ValueError("TMDB_API_KEY not found in environment variables")

app = Flask(__name__)
CORS(app)

# Simple in-memory cache
cache = {}
user_profiles = {}  # Simulated user database
booking_history = {}  # Simulated booking data

# Initialize sentiment analyzer
sia = SentimentIntensityAnalyzer()

def get_cache_key(*args):
    """Generate a cache key from arguments."""
    key_str = json.dumps(args, sort_keys=True)
    return hashlib.md5(key_str.encode()).hexdigest()

def cached(timeout=300):
    """Simple decorator for caching function results."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            key = get_cache_key(func.__name__, args, tuple(sorted(kwargs.items())))
            
            # Check cache
            if key in cache:
                cached_data = cache[key]
                if time.time() - cached_data['timestamp'] < timeout:
                    return cached_data['data']
            
            # Call function and cache result
            result = func(*args, **kwargs)
            cache[key] = {
                'data': result,
                'timestamp': time.time()
            }
            return result
        return wrapper
    return decorator

# Configure retry strategy for requests
def create_session():
    session = requests.Session()
    retry_strategy = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session

def fetch_movies(pages=10):
    """Fetch movies from TMDB with retry logic and error handling."""
    movies = []
    session = create_session()
    
    for page in range(1, pages + 1):
        try:
            url = "https://api.themoviedb.org/3/movie/popular"
            headers = {"Authorization": f"Bearer {TMDB_API_KEY}"}
            params = {"language": "en-US", "page": page}

            response = session.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            for m in data.get("results", []):
                movies.append({
                    "id": m["id"],
                    "title": m["title"],
                    "genre_ids": m.get("genre_ids", []),
                    "overview": m.get("overview", ""),
                    "vote_average": m.get("vote_average", 0),
                    "popularity": m.get("popularity", 0),
                    "release_date": m.get("release_date", ""),
                    "adult": m.get("adult", False),
                    "original_language": m.get("original_language", ""),
                    "vote_count": m.get("vote_count", 0)
                })

            # Respect rate limits - add delay between requests
            time.sleep(0.2)
            
        except requests.exceptions.RequestException as e:
            logger.warning(f"Failed to fetch page {page}: {e}")
            continue
        except Exception as e:
            logger.error(f"Unexpected error fetching page {page}: {e}")
            continue

    if not movies:
        raise Exception("No movies were fetched from TMDB API")

    df = pd.DataFrame(movies).drop_duplicates(subset="id", keep="first")
    
    # Create better features for recommendation
    df["genres_str"] = df["genre_ids"].apply(lambda x: " ".join(map(str, x)))
    df["features"] = df["genres_str"] + " " + df["overview"].fillna("") + " " + df["original_language"]
    
    return df

@lru_cache(maxsize=1)
def get_movie_data():
    """Cache movie data to avoid refetching on every request."""
    logger.info("Fetching movie data from TMDB...")
    return fetch_movies(pages=10)

@lru_cache(maxsize=1)
def get_similarity_matrix():
    """Cache similarity matrix computation."""
    movies_df = get_movie_data()
    tfidf = TfidfVectorizer(stop_words="english", max_features=5000, ngram_range=(1, 2))
    tfidf_matrix = tfidf.fit_transform(movies_df["features"])
    cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
    return cosine_sim

@cached(timeout=3600)
def get_movie_details(movie_id):
    """Get detailed movie information from TMDB with caching."""
    try:
        url = f"https://api.themoviedb.org/3/movie/{movie_id}"
        headers = {"Authorization": f"Bearer {TMDB_API_KEY}"}
        params = {"language": "en-US", "append_to_response": "keywords,credits"}
        
        session = create_session()
        response = session.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        
        tmdb_data = response.json()
        
        return {
            "id": tmdb_data["id"],
            "title": tmdb_data["title"],
            "overview": tmdb_data.get("overview"),
            "poster_path": f"https://image.tmdb.org/t/p/w500{tmdb_data.get('poster_path', '')}" if tmdb_data.get('poster_path') else None,
            "backdrop_path": f"https://image.tmdb.org/t/p/w780{tmdb_data.get('backdrop_path', '')}" if tmdb_data.get('backdrop_path') else None,
            "genres": [genre["name"] for genre in tmdb_data.get("genres", [])],
            "release_date": tmdb_data.get("release_date"),
            "runtime": tmdb_data.get("runtime"),
            "vote_average": tmdb_data.get("vote_average"),
            "vote_count": tmdb_data.get("vote_count", 0),
            "popularity": tmdb_data.get("popularity", 0),
            "imdb_id": tmdb_data.get("imdb_id"),
            "budget": tmdb_data.get("budget", 0),
            "revenue": tmdb_data.get("revenue", 0),
            "keywords": [kw["name"] for kw in tmdb_data.get("keywords", {}).get("keywords", [])],
            "cast": [cast["name"] for cast in tmdb_data.get("credits", {}).get("cast", [])[:5]],
            "director": [crew["name"] for crew in tmdb_data.get("credits", {}).get("crew", []) 
                        if crew.get("job") == "Director"][:1]
        }
    except Exception as e:
        logger.error(f"Error fetching details for movie {movie_id}: {e}")
        return None

# -------------------- ADVANCED AI FEATURES --------------------

def analyze_sentiment(text):
    """Analyze sentiment of text using VADER."""
    if not text:
        return {"sentiment": "neutral", "score": 0.0}
    
    scores = sia.polarity_scores(text)
    sentiment = "positive" if scores['compound'] > 0.05 else "negative" if scores['compound'] < -0.05 else "neutral"
    return {"sentiment": sentiment, "score": scores['compound']}

def predict_movie_success(movie_details):
    """Predict movie success based on features."""
    features = [
        movie_details.get('vote_average', 0),
        movie_details.get('popularity', 0),
        movie_details.get('budget', 0) / 1000000 if movie_details.get('budget', 0) > 0 else 0,
        len(movie_details.get('genres', [])),
        movie_details.get('runtime', 0) or 0
    ]
    
    # Simple heuristic prediction (replace with trained model)
    success_score = (
        features[0] * 0.3 +  # vote average
        min(features[1] / 100, 1) * 0.2 +  # popularity
        (1 if features[2] > 50 else 0.5) * 0.2 +  # budget
        (min(features[3] / 5, 1)) * 0.2 +  # genre count
        (1 if features[4] > 90 else 0.7) * 0.1  # runtime
    )
    
    return {
        "success_score": round(success_score * 10, 1),
        "prediction": "High" if success_score > 0.7 else "Medium" if success_score > 0.4 else "Low"
    }

def calculate_dynamic_price(base_price, movie_id, show_time):
    """Calculate dynamic pricing based on demand factors."""
    movie_details = get_movie_details(movie_id)
    popularity = movie_details.get('popularity', 0) if movie_details else 0
    
    # Simulate demand factors
    time_until_show = (datetime.fromisoformat(show_time) - datetime.now()).total_seconds() / 3600
    demand_factor = min(popularity / 100, 2)  # Scale popularity
    time_factor = max(1.5 - (time_until_show / 48), 1.0)  # Higher price closer to showtime
    
    dynamic_price = base_price * demand_factor * time_factor
    return round(dynamic_price, 2)

def group_recommendation(user_ids, group_size):
    """Generate recommendations for a group."""
    if group_size <= 1:
        return {"error": "Group size must be at least 2"}
    
    # Simulate group preferences (in real app, fetch from user profiles)
    all_movies = get_movie_data()
    group_preferences = []
    
    for user_id in user_ids[:min(3, group_size)]:  # Limit to 3 users for demo
        user_pref = user_profiles.get(user_id, {})
        preferred_genres = user_pref.get('preferred_genres', [])
        group_preferences.extend(preferred_genres)
    
    # Find movies that match most group preferences
    genre_counts = pd.Series(group_preferences).value_counts()
    top_genres = genre_counts.head(3).index.tolist()
    
    recommended_movies = []
    for _, movie in all_movies.iterrows():
        movie_details = get_movie_details(movie['id'])
        if movie_details:
            movie_genres = [g.lower() for g in movie_details.get('genres', [])]
            genre_match = sum(1 for genre in top_genres if genre.lower() in ' '.join(movie_genres).lower())
            if genre_match > 0:
                recommended_movies.append({
                    **movie_details,
                    "group_match_score": genre_match / len(top_genres)
                })
    
    # Sort by match score and return top 5
    recommended_movies.sort(key=lambda x: x.get('group_match_score', 0), reverse=True)
    return recommended_movies[:5]

def mood_based_recommendation(mood, time_of_day=None, weather=None):
    """Recommend movies based on mood and context."""
    mood_mapping = {
        "happy": ["Comedy", "Animation", "Musical", "Family"],
        "sad": ["Drama", "Romance", "Documentary"],
        "excited": ["Action", "Adventure", "Sci-Fi", "Thriller"],
        "relaxed": ["Drama", "Comedy", "Romance", "Documentary"],
        "romantic": ["Romance", "Drama", "Comedy"]
    }
    
    target_genres = mood_mapping.get(mood.lower(), ["Drama", "Comedy"])
    all_movies = get_movie_data()
    
    recommendations = []
    for _, movie in all_movies.iterrows():
        movie_details = get_movie_details(movie['id'])
        if movie_details:
            movie_genres = movie_details.get('genres', [])
            if any(genre in target_genres for genre in movie_genres):
                recommendations.append(movie_details)
    
    # Consider time of day and weather for additional filtering
    if time_of_day == "night" and weather == "clear":
        # Prefer longer, engaging movies for clear nights
        recommendations.sort(key=lambda x: x.get('runtime', 0), reverse=True)
    elif weather == "rainy":
        # Prefer cozy, indoor movies
        recommendations = [m for m in recommendations if m.get('vote_average', 0) > 7.0]
    
    return recommendations[:5]

def extract_keywords_from_review(review_text):
    """Extract keywords from movie reviews."""
    words = re.findall(r'\b[a-zA-Z]{4,}\b', review_text.lower())
    word_freq = pd.Series(words).value_counts()
    return word_freq.head(10).index.tolist()

# -------------------- ENHANCED ROUTES --------------------

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy", 
        "movie_count": len(get_movie_data()),
        "cache_size": len(cache),
        "users_registered": len(user_profiles)
    })

@app.route("/movies", methods=["GET"])
def get_movies():
    """Get list of available movies for selection."""
    try:
        movies_df = get_movie_data()
        movies_list = []
        
        for _, row in movies_df.iterrows():
            movie_details = get_movie_details(row["id"])
            movies_list.append({
                "id": row["id"],
                "title": row["title"],
                "release_date": row["release_date"],
                "vote_average": row["vote_average"],
                "genres": movie_details.get('genres', []) if movie_details else [],
                "poster": movie_details.get('poster_path') if movie_details else None
            })
        
        return jsonify({"movies": movies_list, "count": len(movies_list)})
    except Exception as e:
        logger.error(f"Error in /movies endpoint: {e}")
        return jsonify({"error": "Failed to fetch movies"}), 500

@app.route("/recommend", methods=["POST"])
def recommend():
    """Get movie recommendations based on input movie with advanced features."""
    try:
        data = request.get_json()
        user_id = data.get("user_id", "anonymous")
        context = data.get("context", {})

        if not data or "movie_id" not in data:
            return jsonify({"error": "Missing movie_id in request body"}), 400

        movie_id = data["movie_id"]

        try:
            movie_id = int(movie_id)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid movie_id format"}), 400

        movies_df = get_movie_data()
        
        if movie_id not in movies_df["id"].values:
            return jsonify({"error": f"Movie ID {movie_id} not found in our database"}), 404

        # Get similarity matrix
        cosine_sim = get_similarity_matrix()
        
        # Find index of the movie
        idx = movies_df[movies_df["id"] == movie_id].index[0]
        
        # Get similarity scores and sort them
        sim_scores = list(enumerate(cosine_sim[idx]))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[1:16]  # Get top 15

        recommended = []
        for i, score in sim_scores:
            rec_id = int(movies_df.iloc[i]["id"])
            
            # Get detailed movie information
            movie_details = get_movie_details(rec_id)
            
            if movie_details:
                # Add AI-powered features
                movie_details["similarity_score"] = float(score)
                movie_details["success_prediction"] = predict_movie_success(movie_details)
                
                # Calculate dynamic pricing
                base_price = 12.99  # Base ticket price
                show_time = (datetime.now() + timedelta(hours=random.randint(2, 48))).isoformat()
                movie_details["dynamic_price"] = calculate_dynamic_price(base_price, rec_id, show_time)
                movie_details["show_time"] = show_time
                
                recommended.append(movie_details)
            
            if len(recommended) >= 8:  # Return more recommendations
                break

        # Get input movie details for context
        input_movie = get_movie_details(movie_id)
        if input_movie:
            input_movie["success_prediction"] = predict_movie_success(input_movie)
        
        # Update user profile with this interaction
        if user_id != "anonymous":
            update_user_profile(user_id, movie_id, "viewed")
        
        return jsonify({
            "input_movie": input_movie,
            "recommendations": recommended,
            "total_recommendations": len(recommended),
            "recommendation_engine": "content_based_hybrid"
        })

    except Exception as e:
        logger.error(f"Error in recommendation: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/recommend/by-title", methods=["POST"])
def recommend_by_title():
    """Get recommendations by movie title with sentiment analysis."""
    try:
        data = request.get_json()
        
        if not data or "title" not in data:
            return jsonify({"error": "Missing title in request body"}), 400
        
        title = data["title"].strip().lower()
        movies_df = get_movie_data()
        
        # Fuzzy matching for title with sentiment analysis
        matching_movies = movies_df[
            movies_df["title"].str.lower().str.contains(title, na=False) |
            movies_df["overview"].str.lower().str.contains(title, na=False)
        ]
        
        if matching_movies.empty:
            return jsonify({"error": f"No movies found with title containing '{title}'"}), 404
        
        # Use the best match with sentiment analysis
        best_match = matching_movies.iloc[0]
        movie_id = int(best_match["id"])
        
        # Analyze sentiment of the overview
        sentiment = analyze_sentiment(best_match["overview"])
        
        response_data = {"movie_id": movie_id, "sentiment_analysis": sentiment}
        
        # Create request for the recommend function
        from flask import current_app
        with current_app.test_request_context(json=response_data):
            result = recommend()
            return result
            
    except Exception as e:
        logger.error(f"Error in recommend_by_title: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/recommend/group", methods=["POST"])
def recommend_group():
    """Get recommendations for a group of users."""
    try:
        data = request.get_json()
        
        if not data or "user_ids" not in data:
            return jsonify({"error": "Missing user_ids in request body"}), 400
        
        user_ids = data["user_ids"]
        group_size = len(user_ids)
        
        recommendations = group_recommendation(user_ids, group_size)
        
        return jsonify({
            "group_recommendations": recommendations,
            "group_size": group_size,
            "strategy": "genre_based_consensus"
        })
        
    except Exception as e:
        logger.error(f"Error in group recommendation: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/recommend/mood", methods=["POST"])
def recommend_mood():
    """Get recommendations based on mood and context."""
    try:
        data = request.get_json()
        
        if not data or "mood" not in data:
            return jsonify({"error": "Missing mood in request body"}), 400
        
        mood = data["mood"]
        time_of_day = data.get("time_of_day")
        weather = data.get("weather")
        
        recommendations = mood_based_recommendation(mood, time_of_day, weather)
        
        return jsonify({
            "mood_based_recommendations": recommendations,
            "mood": mood,
            "context": {"time_of_day": time_of_day, "weather": weather}
        })
        
    except Exception as e:
        logger.error(f"Error in mood recommendation: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/analyze/sentiment", methods=["POST"])
def analyze_review_sentiment():
    """Analyze sentiment of movie reviews."""
    try:
        data = request.get_json()
        
        if not data or "review" not in data:
            return jsonify({"error": "Missing review text"}), 400
        
        review_text = data["review"]
        sentiment = analyze_sentiment(review_text)
        keywords = extract_keywords_from_review(review_text)
        
        return jsonify({
            "sentiment_analysis": sentiment,
            "extracted_keywords": keywords,
            "review_length": len(review_text.split())
        })
        
    except Exception as e:
        logger.error(f"Error in sentiment analysis: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/predict/success", methods=["POST"])
def predict_success():
    """Predict movie success based on features."""
    try:
        data = request.get_json()
        
        if not data or "movie_id" not in data:
            return jsonify({"error": "Missing movie_id"}), 400
        
        movie_id = data["movie_id"]
        movie_details = get_movie_details(movie_id)
        
        if not movie_details:
            return jsonify({"error": "Movie not found"}), 404
        
        prediction = predict_movie_success(movie_details)
        
        return jsonify({
            "movie_id": movie_id,
            "title": movie_details["title"],
            "success_prediction": prediction
        })
        
    except Exception as e:
        logger.error(f"Error in success prediction: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/user/register", methods=["POST"])
def register_user():
    """Register a new user with preferences."""
    try:
        data = request.get_json()
        
        if not data or "user_id" not in data:
            return jsonify({"error": "Missing user_id"}), 400
        
        user_id = data["user_id"]
        preferences = data.get("preferences", {})
        
        user_profiles[user_id] = {
            "preferred_genres": preferences.get("genres", []),
            "preferred_languages": preferences.get("languages", ["en"]),
            "min_rating": preferences.get("min_rating", 6.0),
            "created_at": datetime.now().isoformat()
        }
        
        return jsonify({
            "message": "User registered successfully",
            "user_id": user_id,
            "preferences": user_profiles[user_id]
        })
        
    except Exception as e:
        logger.error(f"Error in user registration: {e}")
        return jsonify({"error": "Internal server error"}), 500

def update_user_profile(user_id, movie_id, action_type):
    """Update user profile based on interactions."""
    if user_id not in user_profiles:
        user_profiles[user_id] = {
            "preferred_genres": [],
            "preferred_languages": [],
            "min_rating": 6.0,
            "interactions": [],
            "created_at": datetime.now().isoformat()
        }
    
    movie_details = get_movie_details(movie_id)
    if movie_details:
        # Update preferred genres
        current_genres = user_profiles[user_id].get("preferred_genres", [])
        new_genres = movie_details.get("genres", [])
        updated_genres = list(set(current_genres + new_genres))[:10]  # Limit to 10 genres
        
        user_profiles[user_id]["preferred_genres"] = updated_genres
        user_profiles[user_id].setdefault("interactions", []).append({
            "movie_id": movie_id,
            "action": action_type,
            "timestamp": datetime.now().isoformat()
        })

@app.route("/clear-cache", methods=["POST"])
def clear_cache():
    """Clear the cache (for development purposes)."""
    global cache
    cache.clear()
    get_movie_data.cache_clear()
    get_similarity_matrix.cache_clear()
    return jsonify({"message": "Cache cleared successfully"})

if __name__ == "__main__":
    # Pre-load data on startup
    try:
        logger.info("Pre-loading movie data...")
        movies_df = get_movie_data()
        logger.info(f"Loaded {len(movies_df)} movies")
        
        logger.info("Pre-computing similarity matrix...")
        cosine_sim = get_similarity_matrix()
        logger.info("Similarity matrix computed successfully")
        
        # Initialize some sample user data
        user_profiles["user1"] = {
            "preferred_genres": ["Action", "Adventure", "Sci-Fi"],
            "preferred_languages": ["en"],
            "min_rating": 7.0,
            "created_at": datetime.now().isoformat()
        }
        
        logger.info("AI Movie Recommendation Service is ready!")
        
    except Exception as e:
        logger.error(f"Failed to pre-load data: {e}")
    
    logger.info("Starting Flask server...")
    app.run(port=5000, debug=True)