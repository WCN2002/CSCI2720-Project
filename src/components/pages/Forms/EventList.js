import React, { useState, useEffect } from 'react';

function EventList() {
    const [events, setEvents] = useState([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch events
    const fetchEvents = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("http://localhost:5000/event/getall", {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "include", // Include cookies in the request
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }
            
            const data = await response.json();
            setEvents(data);
            setIsLoading(false);
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchEvents();
    }, []);

    // Handle Delete
    const handleDelete = async (eventID) => {
        try {
            const response = await fetch(`http://localhost:5000/event/${eventID}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error('Failed to delete event');
            }

            // Remove event from local state
            setEvents(prev => prev.filter(event => event.event_id !== eventID));
            
            // Set success message
            setMessage(`Event deleted successfully`);
            
            // Clear message after 3 seconds
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            // Set error message
            setMessage(`Error: ${err.message}`);
            
            // Clear message after 3 seconds
            setTimeout(() => setMessage(''), 3000);
        }
    };

    // Render loading state
    if (isLoading) {
        return <div>Loading events...</div>;
    }

    // Render error state
    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="list-container">
            <h2>Event List</h2>
            
            {/* Message display */}
            {message && (
                <div 
                    style={{
                        backgroundColor: message.includes('Error') ? '#ffdddd' : '#ddffdd',
                        padding: '10px',
                        marginBottom: '10px',
                        borderRadius: '5px'
                    }}
                >
                    {message}
                </div>
            )}

            {/* Empty state */}
            {events.length === 0 && <p>No events found</p>}

            {/* Event Table */}
            {events.length > 0 && (
                <table>
                    <thead>
                        <tr>
                            <th>Event ID</th>
                            <th>Name</th>
                            <th>Location</th>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Organizer</th>
                            <th>Price</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map(event => (
                            <tr key={event.event_id}>
                                <td>{event.event_id}</td>
                                <td>{event.name}</td>
                                <td>{event.location.name}</td> {/* Accessing location name */}
                                <td>{event.date}</td>
                                <td>{event.description}</td>
                                <td>{event.organizer}</td>
                                <td>{event.price}</td>
                                <td>
                                    <button onClick={() => handleDelete(event.event_id)}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default EventList;