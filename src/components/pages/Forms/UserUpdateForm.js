import React, { useState } from 'react';

const host = "http://localhost:5000";
 // User Update Form
 function UserUpdateForm() {
    const [formData, setFormData] = useState({
      username: '',
      newpassword:'',
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
      console.log('User Update Form Submitted', formData);
      try {
        const response = await fetch(`${host}/user/${formData.username}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: "include",
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (response.status === 200) {
            window.alert("User created successfully!")
            setFormData({
              username: '',
              password: '',
              type: ''
            });
        } else if (response.status === 406) {
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
      <div className="update-form">
        <h2>Update User</h2>
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
            placeholder="New Password"
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
            <option value="">Select New usertype</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <button type="submit">Update User</button>
        </form>
      </div>
    );
  }
  export default UserUpdateForm;