import React, { useEffect, useState } from "react";
import axios from "axios";
import LoginRequest from "../LoginRequest";
import { FaHeart } from "react-icons/fa";

// Inline styles for icons and table
const styles = {
  likedIcon: {
    color: "red",
    cursor: "pointer",
    fontSize: "18px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    borderBottom: "2px solid #ddd",
    padding: "10px",
    textAlign: "left",
  },
  td: {
    padding: "10px",
    textAlign: "left",
  },
};

const Favourite = () => {
  const [likedVenues, setLikedVenues] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  // Fetch user and their favorite locations
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get("http://localhost:5000/user/current", {
          withCredentials: true, // Include cookies in the request
        });
        const user = response.data;

        // Update favorite locations
        setLikedVenues(user.fav_location || []);
        setLoading(false);
      } catch (err) {
        if (err.response?.status === 401) {
          setUnauthorized(true);
        }
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // Toggle favorite status of a location
  const toggleLike = async (loc_id) => {
    try {
      await axios.post(
        "http://localhost:5000/location/toggle_fav",
        { loc_id },
        { withCredentials: true }
      );
      const userResponse = await axios.get("http://localhost:5000/user/current", {
        withCredentials: true,
      });
      const user = userResponse.data;

      const updatedLikedVenues = user.fav_location || [];
      setLikedVenues(updatedLikedVenues);
    } catch (err) {
      if (err.response?.status === 401) {
        setUnauthorized(true);
      }
      setError(err.message);
    }
  };

  if (unauthorized) {
    return <LoginRequest />;
  }

  if (loading) {
    return <div>Loading favorite venues...</div>;
  }

  // Show error message if there is an error
  if (error) {
    return <div style={{ color: "red" }}>Error: {error}</div>;
  }

  // Show a message if there are no favorite venues
  if (likedVenues.length === 0) {
    return <div>No favorite venues to display.</div>;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h1>Favorite Venues</h1>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Latitude</th>
            <th style={styles.th}>Longitude</th>
            <th style={styles.th}>Like</th>
          </tr>
        </thead>
        <tbody>
          {likedVenues.map((venue) => (
            <tr key={venue.loc_id}>
              <td style={styles.td}>{venue.name}</td>
              <td style={styles.td}>{venue.loc_id}</td>
              <td style={styles.td}>{venue.coordinate?.latitude ?? "N/A"}</td>
              <td style={styles.td}>{venue.coordinate?.longitude ?? "N/A"}</td>
              <td style={styles.td}>
                <FaHeart
                  style={styles.likedIcon}
                  onClick={() => toggleLike(venue.loc_id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Favourite;