import { BrowserRouter as Router, Switch, Routes, Route } from 'react-router-dom';
import Main from './components/pages/Main';
import Database from './components/pages/Database';
import Event from './components/pages/Event';
import Venue from './components/pages/Venue';
import Login from './components/pages/Login';
//import Database from './components/pages/Database';
import Navbar from './components/Navbar';
import { AuthProvider } from './components/AuthContext';
import { UniversalSettingsProvider, UniversalStyleSwitches } from './components/SettingProvider';
import Footer from './components/Footer';

import VenueDetail from './components/pages/VenueDetail';
import Favourite from './components/pages/Favoruite';

function App() {
  return (
    <>
    <UniversalSettingsProvider>
    <AuthProvider>
    <UniversalStyleSwitches />
    <Router>
      <Navbar/>
      <Routes>
      <Route path='/' element={<Main/>} />
      <Route path='/favourite' element={<Favourite/>}/>
      <Route path='/database' element={<Database/>}/>
      <Route path='/events' element={<Event/>} />
      <Route path='/locations' element={<Venue/>} />
      <Route path='/Login' element={<Login/>} />
      <Route path='/database' element={<Database/>}/>
      <Route path="/locations/:id" element={<VenueDetail />} />
      </Routes>
    </Router>
    </AuthProvider>
    </UniversalSettingsProvider>
    </>
  );
}

export default App;
