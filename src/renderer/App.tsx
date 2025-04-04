import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import SideNav from './components/sidenav/SideNav';
import Settings from './components/settings/Settings';
import Store from './components/store/Store';
import Favourites from './components/favourites/Favourites';
import Header from './components/header/Header';
import { AiSpace } from './components/aispace/AiSpace';
import { TabsProvider } from './components/utils/TabsContext';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

function App() {
  return (
    <TabsProvider>
      <Router>
        <Header />
        <div className='app-container'>
          <SideNav />
          <div className='content'>
            <Routes>
              {/* ✅ Only wrap `AiSpace` with DndProvider */}
              <Route
                path='/aispace'
                element={
                  <DndProvider backend={HTML5Backend}>
                    <AiSpace />
                  </DndProvider>
                }
              />
              <Route path='/' element={<Favourites />} />
              <Route path='/store' element={<Store />} />
              <Route path='/settings' element={<Settings />} />
            </Routes>
          </div>
        </div>
      </Router>
    </TabsProvider>
  );
}

export default App;
