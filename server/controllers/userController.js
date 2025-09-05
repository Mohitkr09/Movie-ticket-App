import { clerkClient } from '@clerk/express';
import Booking from '../models/Booking.js';
import Movie from '../models/Movie.js';

export const getUserBookings = async(req,res)=>{
  try{
    const user = req.auth().userId;
    const bookings =await Booking.find({user}).populate({
      path:"show",
      populate:{path:"movie"}
    }).sort({createdAt:-1})
  res.json({success:true,bookings})
  }catch(error){
    console.error(error.message);
    res.json({success:false,message:error.message});
  }
}

export const updateFavorite = async (req, res) => {
  try {
    const userId = req.auth.userId; // <-- updated
    const { movieId } = req.body;

    if (!movieId) {
      return res.status(400).json({ success: false, message: 'movieId is required' });
    }

    const user = await clerkClient.users.getUser(userId);

    // ensure privateMetadata exists
    const privateMetadata = user.privateMetadata || {};
    const favorites = privateMetadata.favorites || [];

    let updatedFavorites;
    if (favorites.includes(movieId)) {
      updatedFavorites = favorites.filter((id) => id !== movieId);
    } else {
      updatedFavorites = [...favorites, movieId];
    }

    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: { ...privateMetadata, favorites: updatedFavorites },
    });

    res.json({ success: true, message: 'Favorite movie updated successfully.' });
  } catch (error) {
    console.error('Favorite update error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getFavorites = async (req, res) => {
  try {
    const user = await clerkClient.users.getUser(req.auth.userId);
    const favorites = user.privateMetadata?.favorites || [];

    const movies = await Movie.find({ _id: { $in: favorites } });
    res.json({ success: true, movies });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
