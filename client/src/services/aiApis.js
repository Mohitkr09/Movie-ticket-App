// src/services/aiApi.js
import axios from 'axios'
import toast from 'react-hot-toast'

const AI_BASE_URL = 'http://127.0.0.1:5000' // Replace with your backend URL

// Helper to handle requests with error handling
const handleRequest = async (requestFunc) => {
  try {
    const response = await requestFunc()
    return response.data
  } catch (error) {
    console.error('❌ AI API Error:', error)
    toast.error(
      error.response?.data?.error || error.message || 'AI API request failed'
    )
    return null
  }
}

// ---------------- AI API FUNCTIONS ----------------

// Get recommendations based on a movie ID
export const fetchRecommendations = async (movieId) => {
  return handleRequest(() =>
    axios.post(`${AI_BASE_URL}/recommend`, { movie_id: Number(movieId) })
  )
}

// Get recommendations by title
export const fetchRecommendationsByTitle = async (title) => {
  return handleRequest(() =>
    axios.post(`${AI_BASE_URL}/recommend/by-title`, { title })
  )
}

// Get group recommendations
export const fetchGroupRecommendations = async (userIds) => {
  return handleRequest(() =>
    axios.post(`${AI_BASE_URL}/recommend/group`, { user_ids: userIds })
  )
}

// Mood-based recommendations
export const fetchMoodRecommendations = async (mood, context = {}) => {
  return handleRequest(() =>
    axios.post(`${AI_BASE_URL}/recommend/mood`, { mood, ...context })
  )
}

// Analyze review sentiment
export const analyzeReviewSentiment = async (review) => {
  return handleRequest(() =>
    axios.post(`${AI_BASE_URL}/analyze/sentiment`, { review })
  )
}

// Predict movie success
export const predictMovieSuccess = async (movieId) => {
  return handleRequest(() =>
    axios.post(`${AI_BASE_URL}/predict/success`, { movie_id: Number(movieId) })
  )
}

// Clear AI cache (useful for dev/testing)
export const clearAICache = async () => {
  return handleRequest(() => axios.post(`${AI_BASE_URL}/clear-cache`))
}
