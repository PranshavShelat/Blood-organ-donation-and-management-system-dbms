// src/components/RequestManager.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function RequestManager() {
    const [requests, setRequests] = useState([]);
    const [recipients, setRecipients] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    //state for fullfillment modal model
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRequest, setCurrentRequest] = useState(null);
    const [availableItems, setAvailableItems] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState('');

    const [formData, setFormData] = useState({
        recipient_id: '',
        hospital_id: '',
        request_type: 'Blood',
        request_date: new Date().toISOString().split('T')[0]
    });

    // read
    const fetchData = async () => {
        try {
            const reqRes = await axios.get(`${API_URL}/requests`);
            setRequests(reqRes.data);

            const recRes = await axios.get(`${API_URL}/recipients`);
            setRecipients(recRes.data);

            const hosRes = await axios.get(`${API_URL}/hospitals`);
            setHospitals(hosRes.data);

            if (recRes.data.length > 0 && !formData.recipient_id) {
                setFormData(prev => ({ ...prev, recipient_id: recRes.data[0].recipient_id }));
            }
            if (hosRes.data.length > 0 && !formData.hospital_id) {
                setFormData(prev => ({ ...prev, hospital_id: hosRes.data[0].hospital_id }));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);


    // --- 2. ADD DATA (INSERT) ---
    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API_URL}/requests`, formData);
            alert(response.data.message);
            fetchData();
        } catch (error) {
            console.error('Error adding request:', error);
            alert('Error: ' + (error.response?.data?.error || 'Server error'));
        }
    };
    
    // --- 3. NEW: DELETE DATA ---
    const handleDeleteRequest = async (requestId) => {
        if (window.confirm('Are you sure you want to delete this request?')) {
            try {
                const response = await axios.delete(`${API_URL}/requests/${requestId}`);
                alert(response.data.message);
                fetchData(); // Refresh the list
            } catch (error) {
                console.error('Error deleting request:', error);
                alert('Error: ' + (error.response?.data?.error || 'Could not delete request.'));
            }
        }
    };

    // fullfillment modal logic
    const handleOpenModal = async (request) => {
        setCurrentRequest(request);
        setIsModalOpen(true);
        setSelectedItemId('');
        setAvailableItems([]);

        try {
            if (request.request_type === 'Blood') {
                const response = await axios.get(`${API_URL}/donations/available`);
                setAvailableItems(response.data);
            } else if (request.request_type === 'Organ') {
                const response = await axios.get(`${API_URL}/organs/available`);
                setAvailableItems(response.data);
            }
        } catch (error) {
            console.error('Error fetching available items:', error);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentRequest(null);
    };

    const handleFulfillSubmit = async (e) => {
        e.preventDefault();
        if (!selectedItemId) {
            alert('Please select an item to fulfill the request.');
            return;
        }

        try {
            let response;
            if (currentRequest.request_type === 'Blood') {
                response = await axios.post(`${API_URL}/fulfill_blood_request`, {
                    donation_id: selectedItemId,
                    request_id: currentRequest.request_id
                });
            } else if (currentRequest.request_type === 'Organ') {
                response = await axios.post(`${API_URL}/allocate_organ`, {
                    organ_id: selectedItemId,
                    request_id: currentRequest.request_id
                });
            }
            alert(response.data.message);
            fetchData(); // Refresh the main list
            handleCloseModal(); // Close the modal
        } catch (error) {
            console.error('Error fulfilling request:', error);
            alert('Error: ' + (error.response?.data?.error || 'Server error'));
        }
    };
    
    // Helper function to render the dropdown options
    const renderDropdownOptions = () => {
        if (currentRequest.request_type === 'Blood') {
            return availableItems.map(item => (
                <option key={item.donation_id} value={item.donation_id}>
                    Donation ID {item.donation_id} (Donor: {item.name}, {item.blood_group})
                </option>
            ));
        } else if (currentRequest.request_type === 'Organ') {
             return availableItems.map(item => (
                <option key={item.organ_id} value={item.organ_id}>
                    {item.organ_type} (Donor: {item.donor_name}, {item.blood_group})
                </option>
            ));
        }
        return null;
    };


    return (
        <div>
            {/* --- INSERT FORM CARD --- */}
            <div className="content-card">
                <h2>Create New Request (INSERT)</h2>
                <form onSubmit={handleFormSubmit}>
                    
                    <div className="form-group">
                        <label htmlFor="recipient_id">For Recipient</label>
                        <select id="recipient_id" name="recipient_id" onChange={handleFormChange} value={formData.recipient_id}>
                            <option value="" disabled>Select a Recipient</option>
                            {recipients.map((rec) => (
                                <option key={rec.recipient_id} value={rec.recipient_id}>
                                    {rec.name} (Need: {rec.organ_required})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="hospital_id">At Hospital</label>
                        <select id="hospital_id" name="hospital_id" onChange={handleFormChange} value={formData.hospital_id}>
                             <option value="" disabled>Select a Hospital</option>
                            {hospitals.map((hos) => (
                                <option key={hos.hospital_id} value={hos.hospital_id}>
                                    {hos.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="request_type">Request Type</label>
                        <select id="request_type" name="request_type" onChange={handleFormChange} value={formData.request_type}>
                            <option value="Blood">Blood</option>
                            <option value="Organ">Organ</option>
                        </select>
                    </div>

                     <div className="form-group">
                        <label htmlFor="request_date">Request Date</label>
                        <input id="request_date" name="request_date" type="date" onChange={handleFormChange} value={formData.request_date} required />
                    </div>

                    <button type="submit" className="btn">Create Request</button>
                </form>
            </div>

            {/* --- DATA LIST CARD --- */}
            <div className="content-card">
                <h2>All Requests (SELECT, UPDATE & DELETE)</h2>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Recipient</th>
                            <th>Hospital</th>
                            <th>Type</th>
                            <th>Date</th>
                            <th>Status / Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((req) => (
                            <tr key={req.request_id}>
                                <td>{req.recipient_name}</td>
                                <td>{req.hospital_name}</td>
                                <td>{req.request_type}</td>
                                <td>{new Date(req.request_date).toLocaleDateString()}</td>
                                <td>
                                    {req.status === 'Fulfilled' ? (
                                        <span>✅ Fulfilled</span>
                                    ) : (
                                        <button
                                            className="btn-fulfill"
                                            onClick={() => handleOpenModal(req)}
                                        >
                                            Fulfill
                                        </button>
                                    )}
                                    <button 
                                        className="btn-delete"
                                        onClick={() => handleDeleteRequest(req.request_id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* --- NEW: Fulfillment Modal --- */}
            {isModalOpen && currentRequest && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Fulfill Request for {currentRequest.recipient_name}</h3>
                        <p>Request Type: <strong>{currentRequest.request_type}</strong></p>
                        <form onSubmit={handleFulfillSubmit}>
                            <div className="form-group">
                                <label htmlFor="itemSelect">Select Available {currentRequest.request_type}</label>
                                <select 
                                    id="itemSelect"
                                    value={selectedItemId}
                                    onChange={(e) => setSelectedItemId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Select an item...</option>
                                    {renderDropdownOptions()}
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-delete" onClick={handleCloseModal}>Cancel</button>
                                <button type="submit" className="btn">Confirm Fulfillment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RequestManager;