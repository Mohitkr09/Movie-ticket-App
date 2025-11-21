import mongoose from 'mongoose';

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: Number,            
      required: true,
      ref: 'Movie'
    },
    showDateTime: {
      type: Date,
      required: true
    },
    showPrice: {
      type: Number,
      required: true
    },
    occupiedSeats: {
      type: Map,                
      of: Boolean,
      default: {}
    }
  },
  { minimize: false }
);

const Show = mongoose.model("Show", showSchema);
export default Show;
