import React, { useState, useEffect } from 'react';

function UserList() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/user/getall',{
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle Delete
  const handleDelete = async (username) => {
    try {
      const response = await fetch(`http://localhost:5000/user/${username}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      // Remove user from local state
      setUsers(prev => prev.filter(user => user.username !== username));
      
      // Set success message
      setMessage(`User ${username} deleted successfully`);
      
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
    return <div>Loading users...</div>;
  }

  // Render error state
  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="list-container">
      <h2>User List</h2>
      
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
      {users.length === 0 && <p>No users found</p>}

      {/* User Table */}
      {users.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.username}>
                <td>{user.username}</td>
                <td>{user.type}</td>
                <td>
                  <button onClick={() => handleDelete(user.username)}>
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

export default UserList;