import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    mongoose.connection.on('connected', () => console.log('Database connected'));

    // FIXED — no /quickshow appended
    await mongoose.connect(process.env.MONGO_URI);

  } catch (error) {
    console.log('MongoDB connection error:', error.message);
  }
};

export default connectDB;
