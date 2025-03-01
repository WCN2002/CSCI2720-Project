import React, { useState } from 'react';
import UserCreateForm from './Forms/UserCreateForm'
import UserUpdateForm from './Forms/UserUpdateForm';
import UserList from './Forms/UserList';
import EventCreateForm from './Forms/EventCreateForm';
import EventUpdateForm from './Forms/EventUpdateForm';
import EventList from './Forms/EventList'
import './Database.css'; // We'll create this for styling

// Main Database Component
function Database() {
  const [activeDatabase, setActiveDatabase] = useState('user');

  return (
    <div className="database-container">
      <div className="database-switcher">
        <button 
          className={activeDatabase === 'user' ? 'active' : ''}
          onClick={() => setActiveDatabase('user')}
        >
          User Database
        </button>
        <button 
          className={activeDatabase === 'event' ? 'active' : ''}
          onClick={() => setActiveDatabase('event')}
        >
          Event Database
        </button>
      </div>

      {activeDatabase === 'user' ? <UserDatabase /> : <EventDatabase />}
    </div>
  );
}

// User Database Component
function UserDatabase() {
  const [activeView, setActiveView] = useState('list');

  return (
    <div className="sub-database-container">
      <div className="view-switcher">
      <button 
          className={activeView === 'list' ? 'active' : ''}
          onClick={() => setActiveView('list')}
        >
          User List
        </button>
        <button 
          className={activeView === 'create' ? 'active' : ''}
          onClick={() => setActiveView('create')}
        >
          Create User
        </button>
        <button 
          className={activeView === 'update' ? 'active' : ''}
          onClick={() => setActiveView('update')}
        >
          Update User
        </button>
        
      </div>

      {activeView === 'create' && <UserCreateForm />}
      {activeView === 'update' && <UserUpdateForm />}
      {activeView === 'list' && <UserList />}
    </div>
  );
}

// Event Database Component (similar structure to UserDatabase)
function EventDatabase() {
  const [activeView, setActiveView] = useState('list');

  return (
    <div className="sub-database-container">
      <div className="view-switcher">
        <button 
          className={activeView === 'list' ? 'active' : ''}
          onClick={() => setActiveView('list')}
        >
          Event List
        </button>
        <button 
          className={activeView === 'create' ? 'active' : ''}
          onClick={() => setActiveView('create')}
        >
          Create Event
        </button>
        <button 
          className={activeView === 'update' ? 'active' : ''}
          onClick={() => setActiveView('update')}
        >
          Update Event
        </button>
        
      </div>

      {activeView === 'create' && <EventCreateForm />}
      {activeView === 'update' && <EventUpdateForm />}
      {activeView === 'list' && <EventList />}
    </div>
  );
}

export default Database;