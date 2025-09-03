import os
import pandas as pd
import requests
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
TMDB_API_KEY = os.getenv("TMDB_API_KEY")

if not TMDB_API_KEY:
    raise ValueError("TMDB_API_KEY not found in environment variables")

app = Flask(__name__)
CORS(app)

def fetch_movies():
    url = "https://api.themoviedb.org/3/movie/popular"
    headers = {"Authorization": f"Bearer {TMDB_API_KEY}"}
    params = {"language": "en-US", "page": 1}

    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()  # Raises an error for bad status codes
    data = response.json()

    movies = []
    for m in data.get("results", []):
        movies.append({
            "id": m["id"],
            "title": m["title"],
            "genres": " ".join([str(g) for g in m.get("genre_ids", [])]),
            "overview": m.get("overview", "")
        })

    df = pd.DataFrame(movies)
    df["features"] = df["genres"] + " " + df["overview"]
    return df

# Initialize movie data and similarity matrix
movies = fetch_movies()
tfidf = TfidfVectorizer(stop_words="english")
tfidf_matrix = tfidf.fit_transform(movies["features"])
cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json()

    if not data or "movie_id" not in data:
        return jsonify({"error": "Missing movie_id in request body"}), 400

    movie_id = data["movie_id"]

    # TMDB movie ids are integers, so convert if needed
    try:
        movie_id = int(movie_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid movie_id format"}), 400

    if movie_id not in movies["id"].values:
        return jsonify({"error": f"Movie ID {movie_id} not found"}), 404

    idx = movies[movies["id"] == movie_id].index[0]
    sim_scores = list(enumerate(cosine_sim[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[1:6]

    recommended = []
    for i in sim_scores:
        rec_id = int(movies.iloc[i[0]]["id"])

        # Fetch full details from TMDb API
        details_url = f"https://api.themoviedb.org/3/movie/{rec_id}"
        headers = {"Authorization": f"Bearer {TMDB_API_KEY}"}
        res = requests.get(details_url, headers=headers)

        if res.status_code == 200:
            tmdb_data = res.json()
            recommended.append({
                "id": tmdb_data["id"],
                "title": tmdb_data["title"],
                "overview": tmdb_data.get("overview"),
                "poster_path": tmdb_data.get("poster_path"),
                "backdrop_path": tmdb_data.get("backdrop_path"),
                "genres": tmdb_data.get("genres", []),
                "release_date": tmdb_data.get("release_date"),
                "runtime": tmdb_data.get("runtime"),
                "vote_average": tmdb_data.get("vote_average"),
            })
        else:
            recommended.append({
                "id": rec_id,
                "title": movies.iloc[i[0]]["title"]
            })

    return jsonify({"recommendations": recommended})

if __name__ == "__main__":
    app.run(port=5000, debug=True)
