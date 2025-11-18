// src/components/OrganManager.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function OrganManager() {
    const [organs, setOrgans] = useState([]);
    const [donors, setDonors] = useState([]);
    
    const [formData, setFormData] = useState({
        donor_id: '',
        organ_type: ''
    });

    // --- 1. FETCH DATA ---
    const fetchData = async () => {
        try {
            const organsRes = await axios.get(`${API_URL}/organs`);
            setOrgans(organsRes.data);

            const donorsRes = await axios.get(`${API_URL}/donors`);
            setDonors(donorsRes.data);
            
            if (donorsRes.data.length > 0 && !formData.donor_id) {
                setFormData(prev => ({ ...prev, donor_id: donorsRes.data[0].donor_id }));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- 2. ADD ORGAN ---
    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API_URL}/organs`, formData);
            alert(response.data.message);
            fetchData();
            setFormData(prev => ({ ...prev, organ_type: '' }));
        } catch (error) {
            console.error('Error adding organ:', error);
            alert('Error: ' + (error.response?.data?.error || 'Server error'));
        }
    };
    
    // --- 3. DELETE ORGAN ---
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this organ?')) {
            try {
                const response = await axios.delete(`${API_URL}/organs/${id}`);
                alert(response.data.message);
                fetchData();
            } catch (error) {
                console.error('Error deleting organ:', error);
                alert('Error: ' + (error.response?.data?.error || 'Could not delete.'));
            }
        }
    };

    return (
        <div>
            <div className="content-card">
                <h2>Add New Organ</h2>
                <form onSubmit={handleFormSubmit}>
                    <div className="form-group">
                        <label htmlFor="donor_id">Donor</label>
                        <select id="donor_id" name="donor_id" onChange={handleFormChange} value={formData.donor_id} required>
                            <option value="" disabled>Select a Donor</option>
                            {donors.map((donor) => (
                                <option key={donor.donor_id} value={donor.donor_id}>
                                    {donor.name} (ID: {donor.donor_id}, {donor.blood_group})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="organ_type">Organ Type</label>
                        <input id="organ_type" name="organ_type" placeholder="e.g., Kidney, Heart, Liver" onChange={handleFormChange} value={formData.organ_type} required />
                    </div>
                    <button type="submit" className="btn">Add Organ</button>
                </form>
            </div>

            <div className="content-card">
                <h2>Organ Inventory Log</h2>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Donor Name</th>
                            <th>Organ Type</th>
                            <th>Status</th>
                            <th>Allocated To</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {organs.map((item) => (
                            <tr key={item.organ_id}>
                                <td>{item.donor_name}</td>
                                <td>{item.organ_type}</td>
                                <td>{item.status}</td>
                                <td>{item.recipient_name || '---'}</td>
                                <td>
                                    <button className="btn-delete" onClick={() => handleDelete(item.organ_id)}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default OrganManager;