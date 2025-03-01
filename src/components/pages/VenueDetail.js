// src/components/pages/VenueDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axiosInstance from './axiosInstance'; // Import the axios instance
import { FaArrowLeft } from 'react-icons/fa';
import axios from "axios";

// Fixing Leaflet's default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Define category keywords and their priority (Copied from Venue.js)
const CATEGORY_KEYWORDS = [
  { keyword: "Auditorium", category: "Auditorium", priority: 1 },
  { keyword: "Theatre", category: "Theatre", priority: 2 },
  { keyword: "Concert Hall", category: "Concert Hall", priority: 3 },
  { keyword: "Cinema", category: "Cinema", priority: 4 },
];

// Helper function to parse category from venue name (Copied from Venue.js)
const parseCategory = (name) => {
  const lowerCaseName = name.toLowerCase();

  // Filter keywords that are present in the venue name
  const matchedCategories = CATEGORY_KEYWORDS.filter((item) =>
    lowerCaseName.includes(item.keyword.toLowerCase())
  );

  if (matchedCategories.length > 0) {
    // Sort matched categories by priority
    matchedCategories.sort((a, b) => a.priority - b.priority);
    return matchedCategories[0].category; // Return the highest priority category
  }

  return "Others"; // Default category if no keywords match
};

function VenueDetail() {
  const { id } = useParams(); // Extract the venue loc_id from the URL
  const [venue, setVenue] = useState(null);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');

  // Fetch all venues and find the one with matching loc_id
  useEffect(() => {
    axiosInstance.get('/locations') // Adjust the API endpoint as needed
      .then(response => {
        const allVenues = response.data;
        const selectedVenue = allVenues.find(v => v.loc_id === id);
        if (selectedVenue) {
          const category = parseCategory(selectedVenue.name); // Parse category
          setVenue({ ...selectedVenue, category }); // Set venue with category
          console.log(selectedVenue);
        } else {
          setError('Venue not found.');
        }
      })
      .catch(err => {
        // Check if the error is due to authentication
        if (err.response && err.response.status === 401) {
          setError('Unauthorized access. Please log in.');
        } else {
          setError(err.response?.data?.message || err.message || 'An error occurred.');
        }
      });
  }, [id]);

  // Handle new comment submission
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    axios
      .post(
        "http://localhost:5000/location/addcomment",
        { location_id: id, comment: newComment.trim() },
        { withCredentials: true }
      )
      .then((response) => {
        setVenue(response.data.location); // Update venue with new comment
        setNewComment(""); // Clear input field
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to add comment.");
      });
  };
  
  // Early return for error state
  if (error) {
    return <div style={styles.error}>Error: {error}</div>;
  }

  // Early return for loading state
  if (!venue) {
    return <div style={styles.loading}>Loading venue details...</div>;
  }

  return (
    <div style={styles.container}>
      <h1>{venue.name}</h1>
      <Link to="/locations" style={styles.backLink}>
        <FaArrowLeft /> Back to Venues
      </Link>

      {/* Map Section */}
      <div style={styles.mapSection}>
        <MapContainer
          center={[venue.coordinate.latitude, venue.coordinate.longitude]}
          zoom={15}
          style={styles.map}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[venue.coordinate.latitude, venue.coordinate.longitude]}>
            <Popup>
              {venue.name}
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Venue Details */}
      <div style={styles.detailsSection}>
        <p><strong>ID:</strong> {venue.loc_id}</p>
        <p><strong>Category:</strong> {venue.category}</p>
        <p><strong>Latitude:</strong> {venue.coordinate.latitude}</p>
        <p><strong>Longitude:</strong> {venue.coordinate.longitude}</p>
        <p><strong>Number of Events:</strong> {Array.isArray(venue.hosted_event) ? venue.hosted_event.length : 0}</p>
        {/* Add more details as needed */}
      </div>

      {/* Comments Section */}
      <div style={styles.commentsSection}>
        <h2>User Comments</h2>
        
        {/* Comment Form */}
        <form onSubmit={handleCommentSubmit} style={styles.commentForm}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            style={styles.textarea}
            required
          ></textarea>
          <button type="submit" style={styles.submitButton}>Submit</button>
        </form>

        {/* Comments List */}
        <div style={styles.commentsList}>
          {Array.isArray(venue.comments) && venue.comments.length === 0 ? (
            <p>No comments yet. Be the first to comment!</p>
          ) : (
            Array.isArray(venue.comments) && venue.comments.map((comment, index) => (
            <div key={comment._id || index} style={styles.comment}>
              <p><strong>User:</strong> {comment.user?.username}</p>
              <p>{comment.comment}</p>
            </div>
          ))
          )}
        </div>
      </div>
    </div>
  );
}

// Inline CSS styles
const styles = {
  container: {
    maxWidth: "800px",
    margin: "20px auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    marginBottom: "20px",
    color: "#007bff",
    textDecoration: "none",
    fontSize: "16px",
  },
  mapSection: {
    marginBottom: "20px",
  },
  map: {
    height: "400px",
    width: "100%",
  },
  detailsSection: {
    marginBottom: "30px",
  },
  commentsSection: {
    marginTop: "30px",
  },
  commentForm: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "20px",
  },
  textarea: {
    padding: "10px",
    fontSize: "16px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    resize: "vertical",
    minHeight: "80px",
    marginBottom: "10px",
  },
  submitButton: {
    alignSelf: "flex-end",
    padding: "8px 16px",
    fontSize: "16px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#28a745",
    color: "#fff",
    cursor: "pointer",
  },
  commentsList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  comment: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    backgroundColor: "#f9f9f9",
  },
  loading: {
    textAlign: "center",
    fontSize: "18px",
    color: "#555",
  },
  error: {
    textAlign: "center",
    fontSize: "18px",
    color: "red",
  },
};

export default VenueDetail;
