import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import SideNav from './components/sidenav/SideNav';
import Settings from './components/settings/Settings';
import Store from './components/store/Store';
import Favourites from './components/favourites/Favourites';
import Header from './components/header/Header';

function App() {
  return (
    <Router>
      <Header></Header>
      <div className='app-container'>
        <SideNav />
        <div className='content'>
          <Routes>
            <Route path='/' element={<Favourites />} />
            <Route path='/store' element={<Store />} />
            <Route path='/settings' element={<Settings />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
