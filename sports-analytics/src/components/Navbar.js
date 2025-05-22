// src/components/Navbar.js

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <h1>Sports Analytics</h1>
      <button className="menu-button" onClick={toggleMenu}>
        ☰
      </button>
      <div className={`links ${isMenuOpen ? 'active' : ''}`}>
        <Link to="/" onClick={closeMenu}>Home</Link>
        <Link to="/standings" onClick={closeMenu}>Standings</Link>
        <Link to="/search" onClick={closeMenu}>Search</Link>
      </div>
    </nav>
  );
}

export default Navbar;
