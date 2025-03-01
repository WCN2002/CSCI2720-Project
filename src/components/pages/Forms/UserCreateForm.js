import React, { useState } from 'react';

const host = "http://localhost:5000";
/*//for testing data receive from the frontend
app.post('/user/register', async (req, res) => {
  try {
    console.log(req.body.username);
    console.log(req.body.password);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get events" });
  }});*/

// User Create Form
function UserCreateForm() {
    const [formData, setFormData] = useState({
      username: '',
      password: '',
      type: ''
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
      console.log(host)
      console.log('User Create Form Submitted: ', formData);
      try {
        const response = await fetch(`${host}/user/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: "include",
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (response.ok) {
            window.alert("User created successfully!")
            setFormData({
              username: '',
              password: '',
              type: ''
            });
        } else if (!response.ok) {
          window.alert("User created fail")
          setFormData({
            username: '',
            password: '',
            type: ''
          });
        } 
    } catch (error) {
      window.alert(error)
      setFormData({
        username: '',
        password: '',
        type: ''
      });
    }
    };
  
    return (
      <div className="create-form">
        <h2>Create New User</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="">Select usertype</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <button type="submit">Create User</button>
        </form>
      </div>
    );
  }

  
 

  export default UserCreateForm;