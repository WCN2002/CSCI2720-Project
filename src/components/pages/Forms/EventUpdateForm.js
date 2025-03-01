import React, { useState } from 'react';
const host = "http://localhost:5000";
function EventUpdateForm() {
  const [formData, setFormData] = useState({
    event_id: '',
    name: '',
    location: '',
    date: '',
    description: '',
    organizer: '',
    price:''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Event Update Form Submitted', formData);
    try {
      const response = await fetch(`${host}/event/${formData.event_id}`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json'
          },
          credentials: "include",
          body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok) {
          window.alert("Event updated successfully!")
          setFormData({
            event_id: '',
            name: '',
            location: '',
            date: '',
            description: '',
            organizer: '',
            price:''
          });
      } else if (!response.ok) {
        window.alert("Event updated fail")
        setFormData({
          event_id: '',
          name: '',
          location: '',
          date: '',
          description: '',
          organizer: '',
          price:''
        });
      } 
  } catch (error) {
    window.alert(error)
    setFormData({
      event_id: '',
      name: '',
      location: '',
      date: '',
      description: '',
      organizer: '',
      price:''
    });
  }
  };

  return (
    <div className="update-form">
      <h2>Update Event</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="event_id"
          placeholder="Event ID"
          value={formData.event_id}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="name"
          placeholder="Event Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="location"
          placeholder='Location ID'
          value={formData.location}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="date"
          placeholder="Date"
          value={formData.date}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="organizer"
          placeholder="Organizer"
          value={formData.organizer}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="price"
          placeholder="Price"
          value={formData.price}
          onChange={handleChange}
          required
        />
        <button type="submit">Update Event</button>
      </form>
    </div>
  );
}

export default EventUpdateForm;