// src/components/RecipientManager.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// edit/add form
function RecipientForm({ initialData, admins, onSave, onCancel }) {
    const [formData, setFormData] = useState(initialData);

    useEffect(() => {
        setFormData(initialData);
    }, [initialData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...formData, age: Number(formData.age) });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label htmlFor="name">Name</label>
                <input id="name" name="name" placeholder="Full Name" onChange={handleChange} value={formData.name} required />
            </div>
            <div className="form-group">
                <label htmlFor="age">Age</label>
                <input id="age" name="age" type="number" placeholder="Age" onChange={handleChange} value={formData.age} required />
            </div>
            <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select id="gender" name="gender" onChange={handleChange} value={formData.gender}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="blood_group">Blood Group</label>
                <select id="blood_group" name="blood_group" onChange={handleChange} value={formData.blood_group}>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="organ_required">Organ/Blood Required</label>
                <input id="organ_required" name="organ_required" placeholder="e.g., Kidney or Blood" onChange={handleChange} value={formData.organ_required} required />
            </div>
            <div className="form-group">
                <label htmlFor="contact">Contact</label>
                <input id="contact" name="contact" placeholder="Phone or Email" onChange={handleChange} value={formData.contact} required />
            </div>
            <div className="form-group">
                <label htmlFor="admin_code">Managed By Admin</label>
                <select id="admin_code" name="admin_code" onChange={handleChange} value={formData.admin_code} required>
                    <option value="" disabled>Select an Admin</option>
                    {admins.map((admin) => (
                        <option key={admin.admin_code} value={admin.admin_code}>
                            {admin.username}
                        </option>
                    ))}
                </select>
            </div>
            <div className="modal-actions">
                {onCancel && <button type="button" className="btn-delete" onClick={onCancel}>Cancel</button>}
                <button type="submit" className="btn">{initialData.recipient_id ? 'Update Recipient' : 'Add Recipient'}</button>
            </div>
        </form>
    );
}


function RecipientManager() {
    const [recipients, setRecipients] = useState([]);
    const [admins, setAdmins] = useState([]);

    // --- State for Add/Edit Modals ---
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentRecipient, setCurrentRecipient] = useState(null);
    
    const initialFormState = {
        admin_code: '', name: '', age: '', gender: 'Male',
        blood_group: 'A+', organ_required: '', contact: ''
    };

    // --- 1. FETCH DATA (READ) ---
    const fetchData = async () => {
        try {
            const recipientsResponse = await axios.get(`${API_URL}/recipients`);
            setRecipients(recipientsResponse.data);

            const adminsResponse = await axios.get(`${API_URL}/admins`);
            setAdmins(adminsResponse.data);
            
            // --- THIS IS THE CORRECTED LINE ---
            if (adminsResponse.data.length > 0 && !initialFormState.admin_code) {
                initialFormState.admin_code = adminsResponse.data[0].admin_code;
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- 2. ADD DATA (INSERT) ---
    const handleAddSubmit = async (formData) => {
        try {
            const response = await axios.post(`${API_URL}/recipients`, formData);
            alert(response.data.message);
            fetchData();
            setIsAddModalOpen(false);
        } catch (error) {
            console.error('Error adding recipient:', error);
            alert('Error: ' + (error.response?.data?.error || 'Server error'));
        }
    };
    
    // --- 3. UPDATE DATA ---
    const handleOpenEditModal = (recipient) => {
        setCurrentRecipient(recipient);
        setIsEditModalOpen(true);
    };

    const handleUpdateSubmit = async (formData) => {
        try {
            const response = await axios.put(`${API_URL}/recipients/${currentRecipient.recipient_id}`, formData);
            alert(response.data.message);
            fetchData();
            setIsEditModalOpen(false);
            setCurrentRecipient(null);
        } catch (error) {
            console.error('Error updating recipient:', error);
            alert('Error: ' + (error.response?.data?.error || 'Server error'));
        }
    };

    // --- 4. DELETE DATA ---
    const handleDelete = async (recipientId) => {
        if (window.confirm('Are you sure you want to delete this recipient? This may fail if they have active requests.')) {
            try {
                const response = await axios.delete(`${API_URL}/recipients/${recipientId}`);
                alert(response.data.message);
                fetchData();
            } catch (error) {
                console.error('Error deleting recipient:', error);
                alert('Error: ' + (error.response?.data?.error || 'Could not delete recipient.'));
            }
        }
    };

    return (
        <div>
            {/* --- ADD BUTTON --- */}
            <div className="content-card">
                <h2>Manage Recipients</h2>
                <p>Add new recipients to the system or edit/delete existing ones.</p>
                <button className="btn" onClick={() => setIsAddModalOpen(true)}>Add New Recipient</button>
            </div>

            {/* --- ADD MODAL --- */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Add New Recipient</h3>
                        <RecipientForm
                            initialData={initialFormState}
                            admins={admins}
                            onSave={handleAddSubmit}
                            onCancel={() => setIsAddModalOpen(false)}
                        />
                    </div>
                </div>
            )}
            
            {/* --- EDIT MODAL --- */}
            {isEditModalOpen && currentRecipient && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Edit Recipient: {currentRecipient.name}</h3>
                        <RecipientForm
                            initialData={currentRecipient}
                            admins={admins}
                            onSave={handleUpdateSubmit}
                            onCancel={() => setIsEditModalOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* --- DATA LIST CARD --- */}
            <div className="content-card">
                <h2>Recipient List (SELECT, UPDATE & DELETE)</h2>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Age</th>
                            <th>Requirement</th>
                            <th>Contact</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recipients.map((person) => (
                            <tr key={person.recipient_id}>
                                <td>{person.name}</td>
                                <td>{person.age}</td>
                                <td>{person.organ_required}</td>
                                <td>{person.contact}</td>
                                <td>
                                    <button 
                                        className="btn-edit"
                                        onClick={() => handleOpenEditModal(person)}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        className="btn-delete"
                                        onClick={() => handleDelete(person.recipient_id)}
                                    >
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

export default RecipientManager;