import axios from 'axios'
import toast from 'react-hot-toast'

const AI_BASE_URL = import.meta.env.VITE_AI_URL;

const handleRequest = async (requestFunc) => {
  try {
    const response = await requestFunc();
    return response.data;
  } catch (error) {
    console.error('❌ AI API Error:', error);
    toast.error(error.response?.data?.error || "AI API request failed");
    return null;
  }
};

export const fetchRecommendations = async (movieId) => {
  return handleRequest(() =>
    axios.post(`${AI_BASE_URL}/recommend`, { movie_id: Number(movieId) })
  );
};

export const fetchRecommendationsByTitle = async (title) => {
  return handleRequest(() =>
    axios.post(`${AI_BASE_URL}/recommend/by-title`, { title })
  );
};

export const fetchGroupRecommendations = async (userIds) => {
  return handleRequest(() =>
    axios.post(`${AI_BASE_URL}/recommend/group`, { user_ids: userIds })
  );
};

export const fetchMoodRecommendations = async (mood, context = {}) => {
  return handleRequest(() =>
    axios.post(`${AI_BASE_URL}/recommend/mood`, { mood, ...context })
  );
};

export const analyzeReviewSentiment = async (review) => {
  return handleRequest(() =>
    axios.post(`${AI_BASE_URL}/analyze/sentiment`, { review })
  );
};

export const predictMovieSuccess = async (movieId) => {
  return handleRequest(() =>
    axios.post(`${AI_BASE_URL}/predict/success`, { movie_id: Number(movieId) })
  );
};

export const clearAICache = async () => {
  return handleRequest(() => axios.post(`${AI_BASE_URL}/clear-cache`));
};
