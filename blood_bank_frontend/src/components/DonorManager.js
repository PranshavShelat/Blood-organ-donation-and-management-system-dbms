// src/components/DonorManager.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// --- This is the Edit/Add Form, now a separate component ---
function DonorForm({ initialData, admins, onSave, onCancel }) {
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
                <label htmlFor="contact">Contact</label>
                <input id="contact" name="contact" placeholder="Phone or Email" onChange={handleChange} value={formData.contact} required />
            </div>
            <div className="form-group">
                <label htmlFor="medical_history">Medical History</label>
                <input id="medical_history" name="medical_history" placeholder="e.g., None, Allergies" onChange={handleChange} value={formData.medical_history} />
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
                <button type="submit" className="btn">{initialData.donor_id ? 'Update Donor' : 'Add Donor'}</button>
            </div>
        </form>
    );
}


function DonorManager() {
    const [donors, setDonors] = useState([]);
    const [admins, setAdmins] = useState([]);
    
    // --- State for Add/Edit Modals ---
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentDonor, setCurrentDonor] = useState(null);
    
    const initialFormState = {
        admin_code: '', name: '', age: '', gender: 'Male',
        blood_group: 'A+', contact: '', medical_history: ''
    };

    // --- 1. FETCH DATA (READ) ---
    const fetchData = async () => {
        try {
            const donorsResponse = await axios.get(`${API_URL}/donors`);
            setDonors(donorsResponse.data);

            const adminsResponse = await axios.get(`${API_URL}/admins`);
            setAdmins(adminsResponse.data);
            
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
            const response = await axios.post(`${API_URL}/donors`, formData);
            alert(response.data.message);
            fetchData();
            setIsAddModalOpen(false);
        } catch (error) {
            console.error('Error adding donor:', error);
            alert('Error: ' + (error.response?.data?.error || 'Server error'));
        }
    };
    
    // --- 3. NEW: UPDATE DATA ---
    const handleOpenEditModal = (donor) => {
        setCurrentDonor(donor);
        setIsEditModalOpen(true);
    };

    const handleUpdateSubmit = async (formData) => {
        try {
            const response = await axios.put(`${API_URL}/donors/${currentDonor.donor_id}`, formData);
            alert(response.data.message);
            fetchData();
            setIsEditModalOpen(false);
            setCurrentDonor(null);
        } catch (error) {
            console.error('Error updating donor:', error);
            alert('Error: ' + (error.response?.data?.error || 'Server error'));
        }
    };

    // --- 4. DELETE DATA ---
    const handleDelete = async (donorId) => {
        if (window.confirm('Are you sure you want to delete this donor? This may fail if they have active donations.')) {
            try {
                const response = await axios.delete(`${API_URL}/donors/${donorId}`);
                alert(response.data.message);
                fetchData();
            } catch (error) {
                console.error('Error deleting donor:', error);
                alert('Error: ' + (error.response?.data?.error || 'Could not delete donor.'));
            }
        }
    };

    return (
        <div>
            {/* --- ADD BUTTON --- */}
            <div className="content-card">
                <h2>Manage Donors</h2>
                <p>Add new donors to the system or edit/delete existing ones.</p>
                <button className="btn" onClick={() => setIsAddModalOpen(true)}>Add New Donor</button>
            </div>

            {/* --- ADD MODAL --- */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Add New Donor</h3>
                        <DonorForm
                            initialData={initialFormState}
                            admins={admins}
                            onSave={handleAddSubmit}
                            onCancel={() => setIsAddModalOpen(false)}
                        />
                    </div>
                </div>
            )}
            
            {/* --- EDIT MODAL --- */}
            {isEditModalOpen && currentDonor && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Edit Donor: {currentDonor.name}</h3>
                        <DonorForm
                            initialData={currentDonor}
                            admins={admins}
                            onSave={handleUpdateSubmit}
                            onCancel={() => setIsEditModalOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* --- DATA LIST CARD --- */}
            <div className="content-card">
                <h2>Donor List (SELECT, UPDATE & DELETE)</h2>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Age</th>
                            <th>Blood Group</th>
                            <th>Contact</th>
                            <th>Medical History</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {donors.map((person) => (
                            <tr key={person.donor_id}>
                                <td>{person.name}</td>
                                <td>{person.age}</td>
                                <td>{person.blood_group}</td>
                                <td>{person.contact}</td>
                                <td>{person.medical_history}</td>
                                <td>
                                    <button 
                                        className="btn-edit"
                                        onClick={() => handleOpenEditModal(person)}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        className="btn-delete"
                                        onClick={() => handleDelete(person.donor_id)}
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

export default DonorManager;