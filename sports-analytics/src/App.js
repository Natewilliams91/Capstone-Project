import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SearchPage from './components/SearchPage';
import PlayerDetail from './components/PlayerDetail';
import TeamDetail from './components/TeamDetail';
import Home from './components/Home';
import Standings from './components/Standings';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/player/:playerId" element={<PlayerDetail />} />
          <Route path="/team/:teamId" element={<TeamDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
