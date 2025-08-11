import Booking from '../models/Booking.js'
import Show from '../models/Show.js';
import User from '../models/User.js';
export const isAdmin = async(req,res)=>{
  res.json({success:true,isAdmin:true})
}

export const getDashboardData = async (req, res) => {
  try {
    // All paid bookings
    const bookings = await Booking.find({ isPaid: true });

    // Active shows with populated movie + casts
    const activeShowsRaw = await Show.find({
      showDateTime: { $gte: new Date() }
    })
      .populate({
        path: "movie",
        populate: { path: "casts" } // populate casts inside movie
      })
      .lean();

    // Filter out shows without a movie
    const activeShows = activeShowsRaw.filter(show => show.movie);

    // Total users
    const totalUser = await User.countDocuments();

    // Build dashboard data
    const dashboardData = {
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((acc, booking) => acc + booking.amount, 0),
      activeShows,
      totalUser
    };

    res.json({ success: true, dashboardData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getAllShows = async(req,res) =>{
  try{
    const shows = await Show.find({showDateTime:{$gte:new Date()}}).populate('movie').sort({showDateTime:1})
    res.json({success:true,shows})
  }catch(error){
    console.error(error);
    res.json({success:false,message:error.message})
  }
}

export const getAllBookings = async(req,res)=>{
  try{
    const bookings = await Booking.find({}).populate('user').populate({
      path:"show",
      populate:{path:"movie"}
    }).sort({createdAt:-1})
    res.json({success:true,bookings})
  }catch(error){
    console.error(error);
    res.json({success:false, message:error.message})
  }
}