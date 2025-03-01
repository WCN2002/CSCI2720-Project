import React from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useUniversalSettings } from "./SettingProvider.js"; // Import the context

// Styled Components
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: ${(props) => (props.darkMode ? "#121212" : "#f8f9fa")};
  color: ${(props) => (props.darkMode ? "#ffffff" : "#000000")};
  text-align: center;
  transition: background-color 0.3s ease, color 0.3s ease;
`;

const Box = styled.div`
  background: ${(props) => (props.darkMode ? "#333333" : "#ffffff")};
  border: 1px solid ${(props) => (props.darkMode ? "#555555" : "#ddd")};
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 30px;
  max-width: 400px;
  width: 100%;
`;

const Heading = styled.h1`
  color: ${(props) => (props.darkMode ? "#ff6f61" : "#dc3545")};
  font-size: 2.5rem;
  margin-bottom: 10px;
`;

const Message = styled.p`
  color: ${(props) => (props.darkMode ? "#cccccc" : "#6c757d")};
  font-size: 1.2rem;
  margin-bottom: 20px;
`;

const Button = styled.button`
  background-color: ${(props) => (props.darkMode ? "#007bff" : "#007bff")};
  color: #ffffff;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${(props) => (props.darkMode ? "#0056b3" : "#0056b3")};
  }
`;

function LoginRequest() {
  const navigate = useNavigate();
  const { darkMode } = useUniversalSettings(); // Use the dark mode state

  return (
    <Container darkMode={darkMode}>
      <Box darkMode={darkMode}>
        <Heading darkMode={darkMode}>Access Denied</Heading>
        <Message darkMode={darkMode}>You need to log in to view this page.</Message>
        <Button darkMode={darkMode} onClick={() => navigate("/login")}>
          Go to Login
        </Button>
      </Box>
    </Container>
  );
}

export default LoginRequest;