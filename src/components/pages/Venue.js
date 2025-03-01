// src/components/pages/Venue.js
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getDistance } from "geolib";
import debounce from "lodash.debounce";
import axios from "axios";
import { FaSortUp, FaSortDown, FaHeart, FaRegHeart } from "react-icons/fa";
import LoginRequest from "../LoginRequest";

// Fixing Leaflet's default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;



L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Define category keywords and their priority
const CATEGORY_KEYWORDS = [
  { keyword: "Auditorium", category: "Auditorium", priority: 1 },
  { keyword: "Theatre", category: "Theatre", priority: 2 },
  { keyword: "Concert Hall", category: "Concert Hall", priority: 3 },
  { keyword: "Cinema", category: "Cinema", priority: 4 },
];

function Venue() {
  const [user, setUser] = useState(null);
  const [likedVenues, setLikedVenues] = useState([]);
  const [venues, setVenues] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [unauthorized, setUnauthorized] = useState(false); // Track unauthorized state

  // States for filtering
  const [selectedCategories, setSelectedCategories] = useState({
    Auditorium: false,
    Theatre: false,
    "Concert Hall": false,
    Cinema: false, // New Category
    Others: false,
  });
  const [distance, setDistance] = useState(""); // in kilometers
  const [centralPoint, setCentralPoint] = useState(null); // { latitude, longitude }


  // State for sorting configuration
  const [sortConfig, setSortConfig] = useState({
    key: "eventCount",
    direction: "ascending",
  });


  useEffect(() => {
    const fetchData = async () => {
      try {
        const locationResponse = await axios.get(
          "http://localhost:5000/locations",
          { withCredentials: true }
        );
  
        const locations = locationResponse.data.map((venue) => ({
          ...venue,
          eventCount: Array.isArray(venue.hosted_event)
            ? venue.hosted_event.length
            : 0,
          category: parseCategory(venue.name),
        }));
        setVenues(locations);
  
        const userResponse = await axios.get("http://localhost:5000/user/current", {
          withCredentials: true,
        });
        const user = userResponse.data;
  
        console.log("User data fetched:", user);
  
        if (user?.fav_location) {
          const favLocationIds = user.fav_location.map((fav) => fav._id);
          setLikedVenues(favLocationIds); // Set only the `_id` values
        } else {
          console.log("No favorite locations found for the user.");
          setLikedVenues([]); // Default to an empty array
        }
  
  
        setUser(user);
      } catch (err) {
        console.error("Error fetching data:", err.message);
  
        if (err.response?.status === 401) {
          setUnauthorized(true);
        } else {
          setError(err.message);
        }
      }
    };
  
    fetchData();}, []);





  // Helper function to parse category from venue name
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

  // Handle category checkbox changes
  const handleCategoryChange = (e) => {
    const { name, checked } = e.target;
    setSelectedCategories((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Debounced search input handler
  const handleSearchChange = useMemo(
    () =>
      debounce((value) => {
        setSearchTerm(value);
      }, 300),
    []
  );

  // Handle search input change
  const onSearchChange = (e) => {
    const value = e.target.value;
    handleSearchChange(value);
  };

  // Handle central point selection on map
  const CentralPointSelector = () => {
    useMapEvents({
      click(e) {
        setCentralPoint({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        });
      },
    });
    return null;
  };

  // Calculate filtered venues based on search, category, and distance
  const filteredVenues = useMemo(() => {
    return venues.filter((venue) => {
      // Search filter
      const matchesSearch = venue.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // Category filter
      const categoriesSelected = Object.keys(selectedCategories).filter(
        (cat) => selectedCategories[cat]
      );
      const matchesCategory =
        categoriesSelected.length > 0
          ? categoriesSelected.includes(venue.category)
          : true;

      // Distance filter
      let matchesDistance = true;
      if (distance && centralPoint) {
        const venueDistance = getDistance(
          {
            latitude: centralPoint.latitude,
            longitude: centralPoint.longitude,
          },
          {
            latitude: venue.coordinate.latitude,
            longitude: venue.coordinate.longitude,
          }
        );
        matchesDistance = venueDistance <= distance * 1000; // Convert km to meters
      }

      return matchesSearch && matchesCategory && matchesDistance;
    });
  }, [venues, searchTerm, selectedCategories, distance, centralPoint]);

  // Sorting logic using useMemo for performance optimization
  const sortedVenues = useMemo(() => {
    let sortableVenues = [...filteredVenues];
    if (sortConfig !== null) {
      sortableVenues.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableVenues;
  }, [filteredVenues, sortConfig]);

  // Function to handle sort requests
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Function to display sort indicators (icons)
  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "ascending" ? (
        <FaSortUp />
      ) : (
        <FaSortDown />
      );
    }
    return null;
  };
  
  const toggleLike = async (loc_id) => {
    console.log(loc_id);
    try {
      const response = await axios.post(
        "http://localhost:5000/location/toggle_fav",
        { loc_id },
        { withCredentials: true }
      );
      console.log("API Response:", response.data);

      const updatedUser = response.data.user;
      setUser(updatedUser);
      const updatedLikedVenues = response.data.user.fav_location || [];
      setLikedVenues(updatedLikedVenues); // Update liked venues
      console.log('CURRENT LIKEDVENUE:',likedVenues);
      console.log(response.message);
      console.log(updatedUser);
    } catch (err) {
      console.error("Failed to toggle like:", err.message);
    }
  };

  const isLiked = (loc_id) => likedVenues.includes(loc_id);


  if (unauthorized) {
    return <LoginRequest />;
  }

  // Early return for error state
  if (error) {
    return <div style={styles.error}>Error: {error}</div>;
  }

  // Early return for loading state
  if (!venues.length) {
    return <div style={styles.loading}>Loading venues...</div>;
  }
  

  return (
    <div style={styles.container}>
      <h1>Venues</h1>

      {/* Filter Section */}
      <div style={styles.filterSection}>
        {/* Search Input */}
        <div style={styles.filterItem}>
          <input
            type="text"
            placeholder="Search venues by name"
            onChange={onSearchChange}
            style={styles.searchInput}
          />
        </div>

        {/* Category Filters */}
        <div style={styles.filterItem}>
          <label>
            <strong>Program Category:</strong>
          </label>
          <div style={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                name="Auditorium"
                checked={selectedCategories.Auditorium}
                onChange={handleCategoryChange}
              />
              Auditorium
            </label>
            <label>
              <input
                type="checkbox"
                name="Theatre"
                checked={selectedCategories.Theatre}
                onChange={handleCategoryChange}
              />
              Theatre
            </label>
            <label>
              <input
                type="checkbox"
                name="Concert Hall"
                checked={selectedCategories["Concert Hall"]}
                onChange={handleCategoryChange}
              />
              Concert Hall
            </label>
            <label>
              <input
                type="checkbox"
                name="Cinema"
                checked={selectedCategories.Cinema}
                onChange={handleCategoryChange}
              />
              Cinema
            </label>
            <label>
              <input
                type="checkbox"
                name="Others"
                checked={selectedCategories.Others}
                onChange={handleCategoryChange}
              />
              Others
            </label>
          </div>
        </div>

        {/* Distance Filter */}
        <div style={styles.filterItem}>
          <label>
            <strong>Distance (km):</strong>
          </label>
          <input
            type="number"
            placeholder="Enter distance in km"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            style={styles.distanceInput}
            min="0"
          />
          <p style={styles.distanceInfo}>
            Click on the map to set the central point for distance filtering.
          </p>
        </div>

        {/* Reset Filters Button */}
        <div style={styles.filterItem}>
          <button
            onClick={() => {
              setSelectedCategories({
                Auditorium: false,
                Theatre: false,
                "Concert Hall": false,
                Cinema: false,
                Others: false,
              });
              setDistance("");
              setCentralPoint(null);
              setSearchTerm("");
            }}
            style={styles.resetButton}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Map Section */}
      <div style={styles.mapSection}>
        <MapContainer
          center={[22.35643, 114.1095]} // Default center (e.g., Hong Kong)
          zoom={11}
          style={styles.map}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* Allow user to select central point by clicking on the map */}
          <CentralPointSelector />
          {/* Show central point marker */}
          {centralPoint && (
            <Marker position={[centralPoint.latitude, centralPoint.longitude]}>
              <Popup>
                Central Point
                <br />
                Lat: {centralPoint.latitude.toFixed(5)}, Lng:{" "}
                {centralPoint.longitude.toFixed(5)}
              </Popup>
            </Marker>
          )}
          {/* Show venue markers */}
          {sortedVenues.map((venue) => (
            <Marker
              key={venue.loc_id}
              position={[venue.coordinate.latitude, venue.coordinate.longitude]}
            >
              <Popup>
                <strong>
                  <Link to={`/locations/${venue.loc_id}`}>{venue.name}</Link>
                </strong>
                <br />
                ID: {venue.loc_id}
                <br />
                Category: {venue.category}
                <br />
                Number of Events: {venue.eventCount}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Venue Table */}
      {sortedVenues.length === 0 ? (
        <div>No venues match the selected filters.</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Latitude</th>
              <th style={styles.th}>Longitude</th>
              {/* Sortable header for Number of Events */}
              <th
                style={styles.thClickable}
                onClick={() => requestSort("eventCount")}
              >
                Number of Events {getSortIndicator("eventCount")}
              </th>
              <th style={styles.th}>Like</th>
            </tr>
          </thead>
          <tbody>
            {sortedVenues.map((venue) => (
              <tr key={venue.loc_id} style={styles.tr}>
                <td style={styles.td}>
                  <Link to={`/locations/${venue.loc_id}`} style={styles.link}>
                    {venue.name}
                  </Link>
                </td>
                <td style={styles.td}>{venue.loc_id}</td>
                <td style={styles.td}>{venue.coordinate?.latitude ?? "N/A"}</td>
                <td style={styles.td}>
                  {venue.coordinate?.longitude ?? "N/A"}
                </td>
                <td style={styles.td}>{venue.eventCount}</td>
                <td style={styles.td}>
                  {isLiked(venue._id) ? (
                    <FaHeart
                      style={styles.likedIcon}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent bubbling issues
                        toggleLike(venue.loc_id);
                      }}
                    />
                  ) : (
                    <FaRegHeart
                      style={styles.unlikedIcon}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent bubbling issues
                        toggleLike(venue.loc_id);
                      }}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Inline CSS styles
const styles = {
  likedIcon: {
    color: "red",
    cursor: "pointer",
    fontSize: "18px",  
  },
  unlikedIcon: {
    color: "grey",
    cursor: "pointer", 
    fontSize: "18px",  
  },
  container: {
    maxWidth: "1200px",
    margin: "20px auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  filterSection: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    marginBottom: "20px",
    alignItems: "flex-start",
  },
  filterItem: {
    display: "flex",
    flexDirection: "column",
  },
  searchInput: {
    padding: "8px",
    width: "250px",
    fontSize: "16px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  checkboxGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    marginTop: "5px",
  },
  distanceInput: {
    padding: "8px",
    width: "150px",
    fontSize: "16px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    marginTop: "5px",
  },
  distanceInfo: {
    fontSize: "12px",
    color: "#555",
    marginTop: "5px",
  },
  mapSection: {
    marginBottom: "20px",
  },
  map: {
    height: "400px",
    width: "100%",
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
  thClickable: {
    borderBottom: "2px solid #ddd",
    padding: "10px",
    textAlign: "left",
    cursor: "pointer",
    userSelect: "none",
  },
  tr: {
    borderBottom: "1px solid #ddd",
  },
  td: {
    padding: "10px",
    textAlign: "left",
  },
  link: {
    color: "#007bff",
    textDecoration: "none",
  },
  resetButton: {
    padding: "8px 16px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#f44336",
    color: "#fff",
    cursor: "pointer",
    marginTop: "10px",
  },
  error: {
    textAlign: "center",
    fontSize: "18px",
    color: "red",
  },
  loading: {
    textAlign: "center",
    fontSize: "18px",
    color: "#555",
  },
};

export default Venue;

