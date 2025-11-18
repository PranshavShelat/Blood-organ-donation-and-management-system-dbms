// src/components/DonationManager.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function DonationManager() {
    const [donations, setDonations] = useState([]);
    const [donors, setDonors] = useState([]);
    
    const [formData, setFormData] = useState({
        donor_id: '',
        quantity_ml: 450,
        donation_date: new Date().toISOString().split('T')[0]
    });

    // --- 1. FETCH DATA ---
    const fetchData = async () => {
        try {
            const donationsRes = await axios.get(`${API_URL}/donations`);
            setDonations(donationsRes.data);

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

    // --- 2. ADD DONATION ---
    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = { ...formData, quantity_ml: Number(formData.quantity_ml) };
            const response = await axios.post(`${API_URL}/donations`, dataToSend);
            alert(response.data.message);
            fetchData();
        } catch (error) {
            console.error('Error adding donation:', error);
            alert('Error: ' + (error.response?.data?.error || 'Server error'));
        }
    };
    
    // --- 3. DELETE DONATION ---
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this donation?')) {
            try {
                const response = await axios.delete(`${API_URL}/donations/${id}`);
                alert(response.data.message);
                fetchData();
            } catch (error) {
                console.error('Error deleting donation:', error);
                alert('Error: ' + (error.response?.data?.error || 'Could not delete.'));
            }
        }
    };

    return (
        <div>
            <div className="content-card">
                <h2>Add New Blood Donation</h2>
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
                        <label htmlFor="quantity_ml">Quantity (ml)</label>
                        <input id="quantity_ml" name="quantity_ml" type="number" onChange={handleFormChange} value={formData.quantity_ml} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="donation_date">Donation Date</label>
                        <input id="donation_date" name="donation_date" type="date" onChange={handleFormChange} value={formData.donation_date} required />
                    </div>
                    <button type="submit" className="btn">Add Donation</button>
                </form>
            </div>

            <div className="content-card">
                <h2>Blood Donation Log</h2>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Donor Name</th>
                            <th>Type</th>
                            <th>Quantity (ml)</th>
                            <th>Donation Date</th>
                            <th>Expiry Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {donations.map((item) => (
                            <tr key={item.donation_id}>
                                <td>{item.donor_name}</td>
                                <td>{item.donation_type}</td>
                                <td>{item.quantity_ml}</td>
                                <td>{new Date(item.donation_date).toLocaleDateString()}</td>
                                <td>{new Date(item.expiry_date).toLocaleDateString()}</td>
                                <td>
                                    <button className="btn-delete" onClick={() => handleDelete(item.donation_id)}>
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

export default DonationManager;