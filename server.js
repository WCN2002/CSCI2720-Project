/* 
 * Group 28 Members:
 * TSANG, Ho Yin 1155159307
 * WONG Ching Nam 1155158600
 * YOON Seokhyeon 1155100727
 * YUNG Yu Hin 1155161941
 */
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Location, Event, User } = require("./backend/database"); // Models from database.js
const { v4: uuidv4 } = require("uuid");
const cookieParser = require("cookie-parser");
const {
  downloadAndParseEventsData,
  downloadAndParseVenuesXML,
} = require("./backend/fetch_data");

// JWT token secure key
const JWT_SECRET = "csci-2720-group-28";

// allowed user type, this contains all the user type, so only use in admin route
const allowed_user_type = ["admin", "user"];

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/project");

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5000",
      "http://localhost:8082",
      "http://localhost:3000",
    ], // Allow this origin (adjust port as needed)
    credentials: true, // Allow credentials (cookies) to be sent
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// update the database with the data from the XML files
async function update_database(
  use_local_data = false,
  delete_all_data_when_update = false
) {
  try {
    if (delete_all_data_when_update) {
      // Delete all the existing data before updating for testing purpose
      console.log("Deleting existing data...");
      await Promise.all([
        Location.deleteMany({}),
        Event.deleteMany({}),
        User.deleteMany({}),
      ]);
      console.log("Existing data deleted successfully.");
    }

    // variable to store the events and venues data
    let eventsData;
    let venuesData;

    if (use_local_data) {
      eventsData = JSON.parse(
        fs.readFileSync("./backend/data/events.json", "utf8")
      );
      venuesData = JSON.parse(
        fs.readFileSync("./backend/data/venues.json", "utf8")
      );
      console.log(
        "Event data and Venue data are loaded from local files for easier testing."
      );
    } else {
      // Download and parse the events and venues data
      console.log("Downloading and parsing data...");
      console.log("This may take around 30 seconds, please be patient.");
      console.log(
        "If the database is not initialized, please wait for a while."
      );
      [eventsData, venuesData] = await Promise.all([
        downloadAndParseEventsData(),
        downloadAndParseVenuesXML(),
      ]);
      console.log("Data downloaded and parsed successfully.");
      console.log("Updating data into the database...");
    }

    const chosenVenueData = JSON.parse(
      fs.readFileSync("./backend/chosen_venue.json", "utf8")
    );

    const chosenLocIDs = chosenVenueData.loc_id;

    // Filter the venues based on chosen loc_id
    const filteredVenues = venuesData.filter((v) =>
      chosenLocIDs.includes(v.loc_id)
    );

    // Create a lookup from loc_id to the inserted Location's _id
    const locIdToObjectId = {};

    const locationPromises = filteredVenues.map(async (venue) => {
      let location = await Location.findOne({ loc_id: venue.loc_id }).lean();

      if (!location) {
        location = new Location(venue);
        await location.save();
        console.log(`Location ${venue.loc_id} inserted successfully.`);
      } else {
        console.log(`Location ${venue.loc_id} already exists.`);
      }

      locIdToObjectId[venue.loc_id] = location._id;
    });

    await Promise.all(locationPromises);

    // Filter events based on chosen loc_id
    const filteredEvents = eventsData.filter((e) =>
      chosenLocIDs.includes(e.loc_id)
    );

    const eventPromises = filteredEvents.map(async (evt) => {
      let event = await Event.findOne({ event_id: evt.event_id }).lean();

      if (!event) {
        event = new Event({
          event_id: evt.event_id,
          name: evt.name,
          location: locIdToObjectId[evt.loc_id],
          date: evt.date,
          description: evt.description,
          organizer: evt.organizer,
          price: evt.price,
        });
        await event.save();
        console.log(`Event ${evt.event_id} inserted successfully.`);

        // Update hosted_event array in the corresponding location
        await Location.findByIdAndUpdate(event.location, {
          $push: { hosted_event: event._id },
        });
      } else {
        console.log(`Event ${evt.event_id} already exists.`);
      }
    });

    await Promise.all(eventPromises);

    console.log("Events processed successfully.");

    // static users data
    // for both user in json, the password is "pass" in hashed form
    const usersData = JSON.parse(
      fs.readFileSync("./backend/data/users.json", "utf8")
    );

    const userPromises = usersData.map(async (userData) => {
      let user = await User.findOne({ username: userData.username }).lean();

      if (!user) {
        user = new User(userData);
        await user.save();
        console.log(`User ${userData.username} inserted successfully.`);
      } else {
        console.log(`User ${userData.username} already exists.`);
      }
    });

    await Promise.all(userPromises);
    console.log("Users processed successfully.");

    console.log("Database updated successfully.");
  } catch (error) {
    console.error("Error inserting data:", error);
  }
}

db.once("open", async function () {
  console.log("Connected to MongoDB");

  try {
    await update_database();
  } catch (error) {
    console.error("Error updating database:", error);
  }
});

//--------------------------------Token Authentication Middleware--------------------------------
// saved JWT tokens
const saved_tokens = {};

// Middleware to check JWT token in cookies
// check if the jwt token is valid ADMIN toekn, only admin can access
const authenticateAdminToken = (req, res, next) => {
  const jwt_token = req.cookies["jwt-token"]; // Get the token from the cookie

  if (!jwt_token) {
    return res.status(401).json({ message: "Access token missing." });
  }

  const decoded_value = jwt.decode(jwt_token);
  const user_jwt_list = saved_tokens[decoded_value.username];

  try {
    // Check if the field is an array
    if (!Array.isArray(user_jwt_list)) {
      return res.status(403).json({ message: "Invalid token." });
    }

    if (!user_jwt_list.includes(jwt_token)) {
      return res.status(403).json({ message: "Invalid token." });
    }

    if (decoded_value.type !== "admin") {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    jwt.verify(jwt_token, JWT_SECRET);
  } catch (error) {
    console.error("Token verification failed:", error);
    user_jwt_list.pop(jwt_token);
    return res.status(403).json({ message: "Invalid token." });
  }

  req.user = { username: decoded_value.username, type: decoded_value.type };
  next();
};

// Middleware to check JWT token in cookies
// check if the jwt token is valid, both admin and user can access
const authenticateUserToken = (req, res, next) => {
  const jwt_token = req.cookies["jwt-token"]; // Get the token from the cookie

  if (!jwt_token) {
    return res.status(401).json({ message: "Access token missing." });
  }

  const decoded_value = jwt.decode(jwt_token);
  const user_jwt_list = saved_tokens[decoded_value.username];

  try {
    // Check if the field is an array
    if (!Array.isArray(user_jwt_list)) {
      return res.status(403).json({ message: "Invalid token." });
    }

    if (!user_jwt_list.includes(jwt_token)) {
      return res.status(403).json({ message: "Invalid token." });
    }

    jwt.verify(jwt_token, JWT_SECRET);
  } catch (error) {
    console.error("Token verification failed:", error);
    user_jwt_list.pop(jwt_token);
    return res.status(403).json({ message: "Invalid token." });
  }

  req.user = { username: decoded_value.username, type: decoded_value.type };
  next();
};

//--------------------------------Login/Logout Routes--------------------------------
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
      console.log("Invalid username");
      return res.status(400).json({ message: "Invalid username or password." });
    }

    // Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log("Invalid password");
      return res.status(400).json({ message: "Invalid username or password." });
    }

    // call the update database function to update the database in background
    update_database(false, false);

    // Create a JWT payload
    const payload = {
      username: user.username,
      type: user.type,
      unique_id: uuidv4(), // ensure the jwt is unique
    };

    // Sign the JWT token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    if (Array.isArray(saved_tokens[username])) {
      saved_tokens[username].push(token);
      // clean up all expired tokens
      saved_tokens[username].forEach((token) => {
        try {
          jwt.verify(token, JWT_SECRET);
        } catch (error) {
          saved_tokens[username].pop(token);
        }
      });
    } else {
      saved_tokens[username] = [token];
    }

    // Set the JWT as a cookie
    res.cookie("jwt-token", token, {
      httpOnly: false, // Prevents JavaScript access to cookies
      secure: false, // Set to true if using HTTPS
      sameSite: "Lax", // Set to "None" to allow cross-site cookies
      maxAge: 60 * 60 * 1000, // Cookie expiration time (1 hour)
    });

    return res.json({ success: true, message: "Login successful." });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error." });
  }
});

// logout route
app.post("/logout", (req, res) => {
  const jwt_token = req.cookies["jwt-token"];
  res.clearCookie("jwt-token"); // clear jwt-token anyway when using logout

  try {
    try {
      const decoded_value = jwt.decode(jwt_token);
      const user_jwt_list = saved_tokens[decoded_value.username];
      if (user_jwt_list) {
        user_jwt_list.pop(jwt_token);

        // clean up all expired tokens
        user_jwt_list.forEach((token) => {
          try {
            jwt.verify(token, JWT_SECRET);
          } catch (error) {
            user_jwt_list.pop(token);
          }
        });
      }
    } catch (error) {
      console.error("JWT token error:", error);
      return res.json({ success: true, message: "Logout completed." });
    }
    return res.json({ success: true, message: "Logout successful." });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Server error." });
  }
});

//--------------------------------User Routes--------------------------------
// route for register new user route
app.post("/user/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the username already exists
    const existingUser = await User.findOne({ username }).lean();
    if (existingUser) {
      console.log(`user ${username} already exists`);
      return res.status(400).json({ message: "Username already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      password: hashedPassword,
      type: "user",
    });

    // Save the user to the database
    await newUser.save();
    console.log(`new user ${username} registered successfully`);

    return res.status(201).json({
      success: true,
      message: `new user ${username} registered successfully`,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Server error." });
  }
});

// route for admin to create new user in any type
app.post("/user/create", authenticateAdminToken, async (req, res) => {
  const { username, password, type } = req.body;

  const allowed_user_type = ["admin", "user"];

  try {
    if (!allowed_user_type.includes(type)) {
      return res.status(400).json({ message: "Invalid user type." });
    }

    // Check if the username already exists
    const existingUser = await User.findOne({ username }).lean();
    if (existingUser) {
      console.log(`user ${username} already exists`);
      return res.status(400).json({ message: "Username already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      password: hashedPassword,
      type: type,
    });

    // Save the user to the database
    await newUser.save();
    console.log(`new ${type} type user ${username} created successfully`);

    return res.status(201).json({
      success: true,
      message: `new ${type} type user ${username} created successfully`,
    });
  } catch (error) {
    console.error("User Creation error:", error);
    return res.status(500).json({ message: "Server error." });
  }
});

app.get("/user/getall", authenticateAdminToken, async (req, res) => {
  try {
    const users = await User.find({})
      .populate("fav_location")
      .populate("fav_event")
      .lean();
    return res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to get users" });
  }
});

// update to existing event
app.put("/user/:username", authenticateAdminToken, async (req, res) => {
  const { username } = req.params;
  const { password, type } = req.body;

  try {
    // Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: "Invalid username." });
    }

    // Update the user fields if they exist in the request body
    if (password && password.length > 0) {
      user.password = await bcrypt.hash(password, 10);
    }

    if (allowed_user_type.includes(type)) {
      user.type = type;
    }

    // Save the updated user to the database
    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("User update error:", error);
    return res.status(500).json({ message: "Server error." });
  }
});

// update to existing event
app.delete("/user/:username", authenticateAdminToken, async (req, res) => {
  const { username } = req.params;

  try {
    // Find the user by username
    const user = await User.findOne({ username }).lean();

    if (!user) {
      return res.status(400).json({ message: "Invalid username." });
    }

    // Delete the user from the database
    await User.deleteOne({ username });

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    console.error("User deletion error:", error);
    return res.status(500).json({ message: "Server error." });
  }
});

app.get("/user/current", authenticateUserToken, async (req, res) => {
  try {
    const username = req.user.username; // Extract the username from the token

    // Find the user by username and populate the necessary fields
    const user = await User.findOne({ username })
      .populate("fav_location") // Populate favorite locations
      .populate("fav_event") // Populate favorite events (if needed)
      .lean();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return the user details
    return res.status(200).json(user);
  } catch (error) {
    console.error("Failed to fetch current user:", error);
    return res.status(500).json({ error: "Failed to fetch current user" });
  }
});

//--------------------------------Location Routes--------------------------------
app.get("/locations", authenticateUserToken, async (req, res) => {
  try {
    const locations = await Location.find({})
      .populate("comments.user", "username")
      .populate("hosted_event")
      .lean();

    return res.json(locations);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to get locations" });
  }
});

app.get("/location/getall", authenticateUserToken, async (req, res) => {
  try {
    const locations = await Location.find({})
      .populate("comments.user", "username")
      .populate("hosted_event")
      .lean();

    return res.json(locations);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to get locations" });
  }
});

app.get("/location/:location_id", authenticateUserToken, async (req, res) => {
  const { location_id } = req.params;
  try {
    const location = await Location.findOne({ loc_id: location_id })
      .populate("comments.user", "username")
      .populate("hosted_event")
      .lean();

    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    return res.json(location);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to get location" });
  }
});

app.post("/location/addcomment", authenticateUserToken, async (req, res) => {
  const { location_id, comment } = req.body;

  const username = req.user.username;

  try {
    // Find the user by username
    const user = await User.findOne({ username }).lean();

    if (!user) {
      return res.status(400).json({ message: "Invalid username." });
    }

    // Find the location by loc_id
    const location = await Location.findOne({ loc_id: location_id });

    if (!location) {
      return res.status(400).json({ message: "Invalid location ID." });
    }

    // Add the comment to the location
    location.comments.push({ user: user._id, comment });

    // Save the updated location
    await location.save();
    const updatedLocation = await Location.findOne({ loc_id: location_id })
    .populate("comments.user", "username")
    .populate("hosted_event")
    .lean();

    return res.status(200).json({
    success: true,
    message: "Comment added successfully.",
    location: updatedLocation, 
    });

  } catch (error) {
    console.error("Error adding comment:", error);
    return res.status(500).json({ message: "Server error." });
  }
});

// Toggle location in user's favorite list
app.post("/location/toggle_fav", authenticateUserToken, async (req, res) => {
  const { loc_id } = req.body;

  const username = req.user.username;

  try {
    // Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: "Invalid username." });
    }

    // Find the location by loc_id
    const location = await Location.findOne({ loc_id }).lean();

    if (!location) {
      return res.status(400).json({ message: "Invalid location ID." });
    }

    // Check if the location is already in the user's fav_location list
    const locationIndex = user.fav_location.indexOf(location._id);
    if (locationIndex > -1) {
      // If found, remove it
      user.fav_location.splice(locationIndex, 1);
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Location removed from favorites successfully.",
        user,
      });
    } else {
      // If not found, add it
      user.fav_location.push(location._id);
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Location added to favorites successfully.",
        user,
      });
    }
  } catch (error) {
    console.error("Error toggling location in favorites:", error);
    return res.status(500).json({ message: "Server error." });
  }
});

//--------------------------------Event Routes--------------------------------
// get all events
app.get("/event/getall", authenticateUserToken, async (req, res) => {
  try {
    const events = await Event.find({}).populate("location").lean();
    return res.json(events);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to get events" });
  }
});

// create new event
app.post("/event/create", authenticateAdminToken, async (req, res) => {
  const { name, loc_id, date, description, organizer, price } = req.body;
  // modification of database require admin previlige
  const user_type = req.user.type;

  try {
    if (user_type !== "admin") {
      return res.status(403).json({ message: "Unauthorized access." });
    }
    // Find the location by loc_id
    const location = await Location.findOne({ loc_id }).lean();

    if (!location) {
      return res.status(400).json({ message: "Invalid location ID." });
    }

    // Create a new event
    const newEvent = new Event({
      event_id: uuidv4() + String(new Date().getTime()), // Generate a unique event ID
      name,
      location: location._id,
      date,
      description,
      organizer,
      price,
    });

    // Save the event to the database
    const savedEvent = await newEvent.save();

    // Update the hosted_event array in the location
    await Location.findByIdAndUpdate(location._id, {
      $push: { hosted_event: savedEvent._id },
    });

    return res.status(201).json({
      success: true,
      message: "Event created successfully.",
      event: savedEvent,
    });
  } catch (error) {
    console.error("Event creation error:", error);
    return res.status(500).json({ message: "Server error." });
  }
});

// update to existing event
app.put("/event/:event_id", authenticateAdminToken, async (req, res) => {
  const { event_id } = req.params;
  const { name, loc_id, date, description, organizer, price } = req.body;

  // modification of database requires admin privilege
  const user_type = req.user.type;

  try {
    if (user_type !== "admin") {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    // Find the event by event_id
    const event = await Event.findOne({ event_id });

    if (!event) {
      return res.status(400).json({ message: "Invalid event ID." });
    }

    // Update the event fields if they exist in the request body
    if (name) {
      event.name = name;
    }
    if (loc_id) {
      const location = await Location.findOne({ loc_id }).lean();
      if (!location) {
        return res.status(400).json({ message: "Invalid location ID." });
      }
      event.location = location._id;
    }
    if (date) {
      event.date = date;
    }
    if (description) {
      event.description = description;
    }
    if (organizer) {
      event.organizer = organizer;
    }
    if (price) {
      event.price = price;
    }

    // Save the updated event to the database
    const updatedEvent = await event.save();

    return res.status(200).json({
      success: true,
      message: "Event updated successfully.",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Event update error:", error);
    return res.status(500).json({ message: "Server error." });
  }
});

// delete event
app.delete("/event/:event_id", authenticateAdminToken, async (req, res) => {
  const { event_id } = req.params;

  // modification of database requires admin privilege
  const user_type = req.user.type;

  try {
    if (user_type !== "admin") {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    // Find the event by event_id
    const event = await Event.findOne({ event_id }).lean();

    if (!event) {
      return res.status(400).json({ message: "Invalid event ID." });
    }

    // Remove the event from the database
    await Event.deleteOne({ _id: event._id });

    // Remove the event from the hosted_event array in the location
    await Location.findByIdAndUpdate(event.location, {
      $pull: { hosted_event: event._id },
    });

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully.",
      event: event,
    });
  } catch (error) {
    console.error("Event deletion error:", error);
    return res.status(500).json({ message: "Server error." });
  }
});

// Toggle event in user's favorite list
app.post("/event/toggle_fav", authenticateUserToken, async (req, res) => {
  const { event_id } = req.body;

  const username = req.user.username;

  try {
    // Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: "Invalid username." });
    }

    // Find the event by event_id
    const event = await Event.findOne({ event_id }).lean();

    if (!event) {
      return res.status(400).json({ message: "Invalid event ID." });
    }

    // Check if the event is already in the user's fav_event list
    const eventIndex = user.fav_event.indexOf(event._id);
    if (eventIndex > -1) {
      // If found, remove it
      user.fav_event.splice(eventIndex, 1);
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Event removed from favorites successfully.",
        user,
      });
    } else {
      // If not found, add it
      user.fav_event.push(event._id);
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Event added to favorites successfully.",
        user,
      });
    }
  } catch (error) {
    console.error("Error toggling event in favorites:", error);
    return res.status(500).json({ message: "Server error." });
  }
});

const port = 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});