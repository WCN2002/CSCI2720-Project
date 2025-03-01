const mongoose = require("mongoose");

// Define the User schema
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "username is required"],
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [10], // Optional: enforce minimum length
  },
  type: {
    type: String,
    enum: ["admin", "user"],
    required: [true, "account type is required"],
    default: "user",
  },
  fav_location: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location", // Reference to Location model
    },
  ],
  fav_event: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event", // Reference to Event model
    },
  ],
  coordinate: {
    latitude: {
      type: Number,
      required: [false, "Latitude is required"],
    },
    longitude: {
      type: Number,
      required: [false, "Longitude is required"],
    },
  },
});

// Define the Location schema
const LocationSchema = new mongoose.Schema({
  loc_id: {
    type: String,
    required: [true, "Location ID is required"],
    unique: true,
  },
  name: {
    type: String,
    required: [true, "Location name is required"],
  },
  coordinate: {
    latitude: {
      type: Number,
      required: [true, "Latitude is required"],
    },
    longitude: {
      type: Number,
      required: [true, "Longitude is required"],
    },
  },
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to User model
        required: true,
      },
      comment: {
        type: String,
        required: true,
        trim: true,
      },
    },
  ],
  hosted_event: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event", // Reference to Event model
    },
  ],
});

// Define the Event schema
const EventSchema = new mongoose.Schema({
  event_id: {
    type: String,
    required: [true, "Event ID is required"],
    unique: true,
  },
  name: {
    type: String,
    required: [true, "Event name is required"],
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location", // Reference to Location model
    required: [true, "Location is required for event"],
  },
  date: {
    type: String,
    required: [true, "Event date is required"],
  },
  description: {
    type: String,
    required: true, // Optional if not specified as mandatory
  },
  organizer: {
    type: String,
    required: [true, "organizer of the event is required"],
  },
  price: {
    type: String,
    required: [true, "Price is optional"],
  },
});

// Create models from the schemas
const Location = mongoose.model("Location", LocationSchema);
const Event = mongoose.model("Event", EventSchema);
const User = mongoose.model("User", UserSchema);

// Exporting the connection function and models
module.exports = {
  Location,
  Event,
  User,
};
