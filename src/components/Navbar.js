// Navbar.js
import React, { useState, useEffect } from "react";
import { Button } from "./Button";
import { Link } from "react-router-dom";
import "./Navbar.css";
import { useAuth } from "./AuthContext"; // Import the useAuth hook
import axios from "axios"; // Import axios for making HTTP requests

function Navbar() {
  const [click, setClick] = useState(false);
  const [button, setButton] = useState(true);
  const { isLogined, authorizedUser, isAdmin, updateLoginStatus } = useAuth(); // Use the useAuth hook to get isAdmin status

  const handleClick = () => setClick(!click);
  const closeMobileMenu = () => setClick(false);

  const showButton = () => {
    if (window.innerWidth <= 960) {
      setButton(false);
    } else {
      setButton(true);
    }
  };

  useEffect(() => {
    showButton();
    window.addEventListener("resize", showButton);

    // Cleanup event listener
    return () => {
      window.removeEventListener("resize", showButton);
    };
  }, []);

  // Function to send logout request to the server
  async function handleLogout() {
    if (window.confirm("Are you sure you want to logout?")) {
      try {
        await axios.post(
          "http://localhost:5000/logout",
          {},
          { withCredentials: true }
        );
        updateLoginStatus();
      } catch (error) {
        console.error("Logout failed:", error);
      }
    }
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
            CSCI2720 G28
            <i className="fab fa-typo3" />
          </Link>
          <div className="menu-icon" onClick={handleClick}>
            <i className={click ? "fas fa-times" : "fas fa-bars"} />
          </div>
          <ul className={click ? "nav-menu active" : "nav-menu"}>
            <li className="nav-item">
              <Link to="/" className="nav-links" onClick={closeMobileMenu}>
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/locations"
                className="nav-links"
                onClick={closeMobileMenu}
              >
                Map
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/events"
                className="nav-links"
                onClick={closeMobileMenu}
              >
                Events
              </Link>
            </li>

        

            <li className="nav-item">
              <Link
                to="/favourite"
                className="nav-links"
                onClick={closeMobileMenu}
              >
                Favourite
              </Link>
            </li>

            {isAdmin && (
              <li className="nav-item">
                <Link
                  to="/database"
                  className="nav-links"
                  onClick={closeMobileMenu}
                >
                  Database
                </Link>
              </li>
            )}

            <li>
              {isLogined ? (
                <span className="nav-links" onClick={handleLogout}>
                  {authorizedUser}
                </span>
              ) : (
                <Link
                  to="/Login"
                  className="nav-links"
                  onClick={closeMobileMenu}
                >
                  Login
                </Link>
              )}
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
