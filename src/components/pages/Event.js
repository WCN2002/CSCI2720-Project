// src/components/pages/Event.js
import React, { useEffect, useState } from "react";
import LoginRequest from "../LoginRequest";
import styled from "styled-components";

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 40px auto;
  padding: 0 20px;
  font-family: Arial, sans-serif;
`;

const EventGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const Card = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  transition: transform 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const Button = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  align-self: flex-end;

  &:hover {
    background-color: #0056b3;
  }
`;

const ModalBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: ${({ show }) => (show ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${props => props.darkMode ? 'black' : 'white'};
  color: ${props => props.darkMode ? 'white' : 'black'};
  padding: 30px;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
`;

const DateText = styled.p`
  white-space: pre-line;
  margin: 5px 0;
`;

function Event() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false); // Track unauthorized state
  const [selectedEvent, setSelectedEvent] = useState(null); // For modal

  useEffect(() => {
    // Fetch all events
    fetch("http://localhost:5000/event/getall", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) {
          let errorMsg = "Failed to fetch events";
          try {
            const data = await response.json();
            errorMsg = data.message || data.error || errorMsg;
          } catch (e) {}
          throw new Error(errorMsg);
        }
        return response.json();
      })
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err.response?.status);
        if (err.response?.status === 401) {
          setUnauthorized(true);
        }else{
          setUnauthorized(true);

        // setError(err.message || "Failed to fetch events");
       }
        setLoading(false);
      });
  }, []);

  /**
   * Formats the date string by replacing common delimiters with line breaks.
   *
   * @param {string} dateString - The raw date string from the backend.
   * @returns {string} - The formatted date string with line breaks.
   */
  const formatDateString = (dateString) => {
    if (!dateString) return "N/A";

    // Replace delimiters with line breaks
    // Delimiters considered: ';', '&', '\t', multiple spaces, etc.
    let formatted = dateString.replace(/;|&|\t/g, '\n');

    // Replace multiple consecutive spaces with single space
    formatted = formatted.replace(/\s{2,}/g, ' ');

    // Trim each line
    formatted = formatted
      .split('\n')
      .map(line => line.trim())
      .join('\n');

    return formatted;
  };

  const handleOpen = (event) => {
    setSelectedEvent(event);
  };

  const handleClose = () => {
    setSelectedEvent(null);
  };
  if (unauthorized) {
    return <LoginRequest />;
  }


  if (loading) {
    return (
      <Container>
        <p>Loading events...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <p style={{ color: 'red' }}>{error}</p>
      </Container>
    );
  }

  return (
    <Container>
      <h2>Upcoming Events</h2>
      <EventGrid>
        {events.map((event) => (
          <Card key={event.event_id}>
            <div>
              <h3>{event.name}</h3>
              <DateText><strong>Date:</strong> {formatDateString(event.date)}</DateText>
              <p><strong>Venue:</strong> {event.location?.name || "Unknown Venue"}</p>
            </div>
            <Button onClick={() => handleOpen(event)}>View Details</Button>
          </Card>
        ))}
      </EventGrid>

      {/* Modal */}
      <ModalBackground show={Boolean(selectedEvent)} onClick={() => setSelectedEvent(null)}>
        <ModalContent onClick={e => e.stopPropagation()}>
          <CloseButton onClick={() => setSelectedEvent(null)}>&times;</CloseButton>
          {selectedEvent && (
            <>
              <h3>{selectedEvent.name}</h3>
              <DateText><strong>Date:</strong> {formatDateString(selectedEvent.date)}</DateText>
              <p><strong>Venue:</strong> {selectedEvent.location?.name || "Unknown Venue"}</p>
              <p><strong>Organizer:</strong> {selectedEvent.organizer}</p>
              <p><strong>Price:</strong> {selectedEvent.price}</p>
              <p><strong>Description:</strong> {selectedEvent.description}</p>
            </>
          )}
        </ModalContent>
      </ModalBackground>
    </Container>
  );
}

export default Event;
