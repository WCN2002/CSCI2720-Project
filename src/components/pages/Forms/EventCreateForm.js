import React, { useState } from 'react';
// Event Components (Similar to User Components)
const host = "http://localhost:5000";
function EventCreateForm() {
  const [formData, setFormData] = useState({
    name: '',
    loc_id: '',
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
    console.log('Event Create Form Submitted', formData);
      try {
        const response = await fetch(`${host}/event/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: "include",
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (response.ok) {
            window.alert("Event created successfully!")
            setFormData({
              name: '',
              loc_id: '',
              date: '',
              description: '',
              organizer: '',
              price:''
            });
        } else if (!response.ok) {
          window.alert("Event created fail")
          setFormData({
            name: '',
            loc_id: '',
            date: '',
            description: '',
            organizer: '',
            price:''
          });
        } 
    } catch (error) {
      window.alert(error)
      setFormData({
        name: '',
        loc_id: '',
        date: '',
        description: '',
        organizer: '',
        price:''
      });
    }
  };

  return (
    <div className="create-form">
      <h2>Create New Event</h2>
      <form onSubmit={handleSubmit}>
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
          name="loc_id"
          placeholder='Location ID'
          value={formData.loc_id}
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
        <button type="submit">Create Event</button>
      </form>
    </div>
  );
}

export default EventCreateForm;