const mongoose = require('mongoose');

const BusRouteSchema = new mongoose.Schema(
  {
    route_name: {
      type: String,
      required: true,
    },
    start_point: {
      type: String,
      required: true,
    },
    end_point: {
      type: String,
      required: true,
    },
    stops: {
      type: [String], 
      required: true,
    },
    distance_km: {
      type: Number,
      required: true,
    },
    estimated_time: {
      type: String, 
      required: true,
    },
    route_map_image: {
      type: String, 
    },
  },
  { timestamps: true }
);

// module.exports = mongoose.model('BusRoute', BusRouteSchema);
module.exports = BusRouteSchema;
