import React, { createContext, useState, useContext, useEffect } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext({
  isLogined: false,
  authorizedUser: "User is not logged in",
  isAdmin: false,
  updateLoginStatus: () => {},
});

export const AuthProvider = ({ children }) => {
  const [isLogined, setIsLogined] = useState(false);
  const [authorizedUser, setAuthorizedUser] = useState("User is not logged in");
  const [isAdmin, setIsAdmin] = useState(false);

  const updateLoginStatus = () => {
    try {
      const jwtToken = Cookies.get("jwt-token");

      if (!jwtToken) {
        setIsLogined(false);
        setAuthorizedUser("User is not logged in");
        setIsAdmin(false);
        return { isLogined, authorizedUser, isAdmin };
      }

      const decodedToken = jwtDecode(jwtToken);

      // Check token expiration
      const currentTime = Date.now() / 1000;
      const isTokenExpired = decodedToken.exp < currentTime;

      // Update and return admin status

      if (isTokenExpired) {
        setIsLogined(false);
        setAuthorizedUser("JWT token expired, please log in again");
        setIsAdmin(false);
        return { isLogined, authorizedUser, isAdmin };
      } else {
        setIsLogined(true);
        setAuthorizedUser(decodedToken.username);
        setIsAdmin(decodedToken.type === "admin");
        return { isLogined, authorizedUser, isAdmin };
      }
    } catch (error) {
      console.error("Admin status check failed:", error);
      setIsLogined(false);
      setAuthorizedUser("JWT token error, please log in again");
      setIsAdmin(false);
      return { isLogined, authorizedUser, isAdmin };
    }
  };

  // Check admin status on initial load
  useEffect(() => {
    updateLoginStatus();

    // Set up listener for token changes
    const checkTokenInterval = setInterval(updateLoginStatus, 60000); // Check every minute

    return () => clearInterval(checkTokenInterval);
  }, []);

  return (
    <AuthContext.Provider
      value={{ isLogined, authorizedUser, isAdmin, updateLoginStatus }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
