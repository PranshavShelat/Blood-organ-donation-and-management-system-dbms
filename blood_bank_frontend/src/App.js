// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import './App.css';

import Dashboard from './components/Dashboard';
import RecipientManager from './components/RecipientManager';
import DonorManager from './components/DonorManager';
import RequestManager from './components/RequestManager';
import DonationManager from './components/DonationManager';
import OrganManager from './components/OrganManager';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <header className="App-header">
          <h1>Blood Bank Management System</h1>
        </header>

        <nav className="navbar">
          <ul className="navbar-nav">
            <li className="nav-item">
              <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                Dashboard
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/recipients" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                Recipients
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/donors" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                Donors
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/requests" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                Requests
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/donations" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                Donations
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/organs" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                Organs
              </NavLink>
            </li>
          </ul>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/recipients" element={<RecipientManager />} />
            <Route path="/donors" element={<DonorManager />} />
            <Route path="/requests" element={<RequestManager />} />
            <Route path="/donations" element={<DonationManager />} />
            <Route path="/organs" element={<OrganManager />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;