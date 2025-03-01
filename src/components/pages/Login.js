import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { updateLoginStatus } = useAuth();

  const navigate = useNavigate();

  // New: State to track failed login attempts
  const [failedAttempts, setFailedAttempts] = useState(0);
  // New: State to manage lockout status
  const [isLocked, setIsLocked] = useState(false);
  // New: State to manage remaining lockout time
  const [lockoutTime, setLockoutTime] = useState(0);

  // New: Key names for localStorage
  const LOCKOUT_KEY = "loginLockoutEndTime";
  const FAILED_ATTEMPTS_KEY = "loginFailedAttempts";

  useEffect(() => {
    // New: Initialize failedAttempts from localStorage
    const storedFailedAttempts = parseInt(
      localStorage.getItem(FAILED_ATTEMPTS_KEY),
      10
    );
    if (!isNaN(storedFailedAttempts)) {
      setFailedAttempts(storedFailedAttempts);
    }

    // New: Check if there's an active lockout
    const lockoutEndTime = localStorage.getItem(LOCKOUT_KEY);
    if (lockoutEndTime) {
      const remainingTime = Math.floor(
        (new Date(lockoutEndTime) - new Date()) / 1000
      );
      if (remainingTime > 0) {
        setIsLocked(true);
        setLockoutTime(remainingTime);
      } else {
        // Lockout period has passed
        localStorage.removeItem(LOCKOUT_KEY);
        localStorage.removeItem(FAILED_ATTEMPTS_KEY);
      }
    }
  }, []); // Run once on mount

  useEffect(() => {
    let timer;
    if (isLocked && lockoutTime > 0) {
      timer = setInterval(() => {
        setLockoutTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            setIsLocked(false);
            setFailedAttempts(0);
            localStorage.removeItem(LOCKOUT_KEY);
            localStorage.removeItem(FAILED_ATTEMPTS_KEY);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLocked, lockoutTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!username || !password) {
      setError("Please enter both username and password.");
      setSuccessMessage("");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/login",
        {
          username,
          password,
        },
        {
          withCredentials: true, // Include cookies in the request
        }
      );

      // New: Check for HTTP status codes
      if (response.status === 200) {
        const { success, message } = response.data;
        if (success) {
          console.log("Login successful");
          setSuccessMessage(message);
          setError("");
          navigate("/");
          // Reset failed attempts on successful login
          setFailedAttempts(0);
          localStorage.removeItem(FAILED_ATTEMPTS_KEY);
          updateLoginStatus();
        } else {
          // Handle cases where success is false but status is 200
          console.log("Login failed");
          setError(message);
          setSuccessMessage("");

          // New: Increment failed attempts
          const newFailedAttempts = failedAttempts + 1;
          setFailedAttempts(newFailedAttempts);
          localStorage.setItem(FAILED_ATTEMPTS_KEY, newFailedAttempts);

          if (newFailedAttempts >= 5) {
            setIsLocked(true);
            setLockoutTime(300); // 5 minutes in seconds

            // New: Calculate and store lockout end time
            const lockoutEnd = new Date(new Date().getTime() + 5 * 60 * 1000);
            localStorage.setItem(LOCKOUT_KEY, lockoutEnd.toISOString());
          }
        }
      }
    } catch (err) {
      console.error(err);
      if (err.response) {
        if (err.response.status === 404) {
          setError("User not found.");
        } else if (err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError("An error occurred. Please try again.");
        }

        // New: Increment failed attempts on error
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        localStorage.setItem(FAILED_ATTEMPTS_KEY, newFailedAttempts);

        if (newFailedAttempts >= 5) {
          setIsLocked(true);
          setLockoutTime(300); // 5 minutes in seconds

          // New: Calculate and store lockout end time
          const lockoutEnd = new Date(new Date().getTime() + 5 * 60 * 1000);
          localStorage.setItem(LOCKOUT_KEY, lockoutEnd.toISOString());
        }
      } else {
        setError("An error occurred. Please try again.");
      }
      setSuccessMessage("");
    }
  };

  // New: Format lockout time as mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Inline CSS styles
  const styles = {
    container: {
      maxWidth: "400px",
      margin: "50px auto",
      padding: "20px",
      borderRadius: "5px",
      fontFamily: "Arial, sans-serif",
    },
    form: {
      display: "flex",
      flexDirection: "column",
    },
    inputGroup: {
      marginBottom: "15px",
    },
    label: {
      marginBottom: "5px",
      fontWeight: "bold",
    },
    input: {
      padding: "10px",
      fontSize: "16px",
      borderRadius: "4px",
      border: "1px solid #ccc",
      width: "100%",
      boxSizing: "border-box",
    },
    button: {
      padding: "10px",
      fontSize: "16px",
      borderRadius: "4px",
      border: "none",
      backgroundColor: "#28a745",
      color: "#fff",
      cursor: "pointer",
      // New: Change cursor and opacity when locked
      ...(isLocked && {
        backgroundColor: "#6c757d",
        cursor: "not-allowed",
        opacity: 0.6,
      }),
    },
    error: {
      color: "red",
      marginBottom: "15px",
      textAlign: "center",
    },
    success: {
      color: "green",
      marginBottom: "15px",
      textAlign: "center",
    },
    lockoutMessage: {
      color: "orange",
      marginBottom: "15px",
      textAlign: "center",
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={{ textAlign: "center" }}>Login</h2>
      {error && <p style={styles.error}>{error}</p>}
      {successMessage && <p style={styles.success}>{successMessage}</p>}
      {/* New: Show lockout message */}
      {isLocked && (
        <p style={styles.lockoutMessage}>
          Too many failed attempts. Please try again in
          {formatTime(lockoutTime)}.
        </p>
      )}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label htmlFor="username" style={styles.label}>
            Username:
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            required
            disabled={isLocked} // New: Disable input when locked
          />
        </div>
        <div style={styles.inputGroup}>
          <label htmlFor="password" style={styles.label}>
            Password:
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
            disabled={isLocked} // New: Disable input when locked
          />
        </div>
        <button type="submit" style={styles.button} disabled={isLocked}>
          {isLocked ? "Locked" : "Login"}
          {/* New: Change button text when locked */}
        </button>
      </form>
    </div>
  );
}

export default Login;
