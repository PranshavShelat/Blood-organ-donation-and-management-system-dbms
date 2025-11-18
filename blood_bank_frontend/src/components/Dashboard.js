// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState({
    pending_requests: 0,
    available_organs: 0,
    total_donors: 0,
    total_recipients: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_URL}/stats`);
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <div className="dashboard-grid">
        <StatCard title="Pending Requests" value={stats.pending_requests} />
        <StatCard title="Available Organs" value={stats.available_organs} />
        <StatCard title="Total Donors" value={stats.total_donors} />
        <StatCard title="Total Recipients" value={stats.total_recipients} />
      </div>
    </div>
  );
}

export default Dashboard;