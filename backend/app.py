# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from db_config import get_db_connection
import mysql.connector
from mysql.connector import Error

# Initialize the Flask app
app = Flask(__name__)
CORS(app)

# --- NEW: Dashboard Stats Endpoint ---
@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    
    try:
        # 1. Pending Requests
        cursor.execute("SELECT COUNT(*) as count FROM requests WHERE status = 'Pending'")
        pending_requests = cursor.fetchone()['count']
        
        # 2. Available Organs
        cursor.execute("SELECT COUNT(*) as count FROM organ WHERE status = 'Available'")
        available_organs = cursor.fetchone()['count']
        
        # 3. Total Donors
        cursor.execute("SELECT COUNT(*) as count FROM donor")
        total_donors = cursor.fetchone()['count']
        
        # 4. Total Recipients
        cursor.execute("SELECT COUNT(*) as count FROM recipient")
        total_recipients = cursor.fetchone()['count']
        
        cursor.close()
        conn.close()
        return jsonify({
            "pending_requests": pending_requests,
            "available_organs": available_organs,
            "total_donors": total_donors,
            "total_recipients": total_recipients
        })
    except Exception as e:
        cursor.close()
        conn.close()
        return jsonify({"error": str(e)}), 500

# --- FUNCTION Endpoints (Calling Stored Functions) ---

# 1. Check if a specific blood donation is expired
# Calls SQL Function: fn_IsBloodUnitExpired
@app.route('/api/donations/<int:id>/check_expiry', methods=['GET'])
def check_donation_expiry(id):
    conn = get_db_connection()
    if conn is None: return jsonify({"error": "DB connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    try:
        # We select the result of the function directly
        cursor.execute("SELECT fn_IsBloodUnitExpired(%s) as status", (id,))
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        # If the donation ID doesn't exist, the function might return None or we handle empty result
        if result:
            return jsonify(result) # Returns {"status": "Valid"} or {"status": "Expired"}
        return jsonify({"error": "Donation not found"}), 404
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# 2. Get the count of pending requests for a specific recipient
# Calls SQL Function: fn_GetPendingRequestCount
@app.route('/api/recipients/<int:id>/pending_count', methods=['GET'])
def get_recipient_pending_count(id):
    conn = get_db_connection()
    if conn is None: return jsonify({"error": "DB connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT fn_GetPendingRequestCount(%s) as pending_count", (id,))
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if result:
            return jsonify(result) # Returns {"pending_count": 2}
        return jsonify({"error": "Recipient not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 400

# --- READ Endpoints (GET requests) ---

@app.route('/api/admins', methods=['GET'])
def get_admins():
    conn = get_db_connection()
    if conn is None: return jsonify({"error": "DB connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM admin")
    admins = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(admins)

@app.route('/api/hospitals', methods=['GET'])
def get_hospitals():
    conn = get_db_connection()
    if conn is None: return jsonify({"error": "DB connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM hospital")
    hospitals = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(hospitals)

@app.route('/api/donors', methods=['GET'])
def get_donors():
    conn = get_db_connection()
    if conn is None: return jsonify({"error": "DB connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM donor ORDER BY donor_id DESC")
    donors = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(donors)

# --- NEW: Get single donor (for edit form) ---
@app.route('/api/donors/<int:id>', methods=['GET'])
def get_donor(id):
    conn = get_db_connection()
    if conn is None: return jsonify({"error": "DB connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM donor WHERE donor_id = %s", (id,))
    donor = cursor.fetchone()
    cursor.close()
    conn.close()
    if donor:
        return jsonify(donor)
    return jsonify({"error": "Donor not found"}), 404

@app.route('/api/recipients', methods=['GET'])
def get_recipients():
    conn = get_db_connection()
    if conn is None: return jsonify({"error": "DB connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM recipient ORDER BY recipient_id DESC")
    recipients = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(recipients)

# --- NEW: Get single recipient (for edit form) ---
@app.route('/api/recipients/<int:id>', methods=['GET'])
def get_recipient(id):
    conn = get_db_connection()
    if conn is None: return jsonify({"error": "DB connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM recipient WHERE recipient_id = %s", (id,))
    recipient = cursor.fetchone()
    cursor.close()
    conn.close()
    if recipient:
        return jsonify(recipient)
    return jsonify({"error": "Recipient not found"}), 404

@app.route('/api/requests', methods=['GET'])
def get_requests():
    conn = get_db_connection()
    if conn is None: return jsonify({"error": "DB connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT 
            r.request_id, r.request_date, r.request_type, r.status,
            rec.name AS recipient_name,
            h.name AS hospital_name
        FROM requests r
        JOIN recipient rec ON r.recipient_id = rec.recipient_id
        JOIN hospital h ON r.hospital_id = h.hospital_id
        ORDER BY r.request_id DESC
    """)
    requests_data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(requests_data)

# --- NEW: Inventory Endpoints (Donations) ---
@app.route('/api/donations', methods=['GET'])
def get_donations():
    conn = get_db_connection()
    if conn is None: return jsonify({"error": "DB connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT d.donation_id, d.quantity_ml, d.donation_date, d.expiry_date, d.donation_type, dn.name as donor_name
        FROM donation d
        JOIN donor dn ON d.donor_id = dn.donor_id
        ORDER BY d.donation_id DESC
    """)
    donations = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(donations)

# --- NEW: Inventory Endpoints (Organs) ---
@app.route('/api/organs', methods=['GET'])
def get_organs():
    conn = get_db_connection()
    if conn is None: return jsonify({"error": "DB connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT o.organ_id, o.organ_type, o.status, dn.name as donor_name, r.name as recipient_name
        FROM organ o
        JOIN donor dn ON o.donor_id = dn.donor_id
        LEFT JOIN requests req ON o.request_id = req.request_id
        LEFT JOIN recipient r ON req.recipient_id = r.recipient_id
        ORDER BY o.organ_id DESC
    """)
    organs = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(organs)

# --- Fulfillment Dropdown Endpoints (no change) ---
@app.route('/api/donations/available', methods=['GET'])
def get_available_donations():
    conn = get_db_connection()
    if conn is None: return jsonify({"error": "DB connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT d.donation_id, dn.name, dn.blood_group
        FROM donation d
        JOIN donor dn ON d.donor_id = dn.donor_id
        WHERE d.donation_type = 'Blood' AND d.expiry_date > CURDATE()
    """)
    donations = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(donations)

@app.route('/api/organs/available', methods=['GET'])
def get_available_organs():
    conn = get_db_connection()
    if conn is None: return jsonify({"error": "DB connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT o.organ_id, o.organ_type, dn.name AS donor_name, dn.blood_group
        FROM organ o
        JOIN donor dn ON o.donor_id = dn.donor_id
        WHERE o.status = 'Available' AND o.request_id IS NULL
    """)
    organs = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(organs)

# --- CREATE Endpoints (POST requests) ---

@app.route('/api/donors', methods=['POST'])
def add_donor():
    data = request.json
    try:
        conn = get_db_connection()
        if conn is None: return jsonify({"error": "DB connection failed"}), 500
        cursor = conn.cursor()
        sql = "INSERT INTO donor (admin_code, name, age, gender, blood_group, contact, medical_history) VALUES (%s, %s, %s, %s, %s, %s, %s)"
        args = (data['admin_code'], data['name'], data['age'], data['gender'], data['blood_group'], data['contact'], data['medical_history'])
        cursor.execute(sql, args)
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Donor added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/recipients', methods=['POST'])
def add_recipient():
    data = request.json
    try:
        conn = get_db_connection()
        if conn is None: return jsonify({"error": "DB connection failed"}), 500
        cursor = conn.cursor()
        sql = "INSERT INTO recipient (admin_code, name, age, gender, blood_group, organ_required, contact) VALUES (%s, %s, %s, %s, %s, %s, %s)"
        args = (data['admin_code'], data['name'], data['age'], data['gender'], data['blood_group'], data['organ_required'], data['contact'])
        cursor.execute(sql, args)
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Recipient added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/requests', methods=['POST'])
def add_request():
    data = request.json
    try:
        conn = get_db_connection()
        if conn is None: return jsonify({"error": "DB connection failed"}), 500
        cursor = conn.cursor()
        sql = "INSERT INTO requests (recipient_id, hospital_id, request_type, request_date, status) VALUES (%s, %s, %s, %s, 'Pending')"
        args = (data['recipient_id'], data['hospital_id'], data['request_type'], data['request_date'])
        cursor.execute(sql, args)
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Request added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# --- NEW: Inventory CREATE Endpoints ---
@app.route('/api/donations', methods=['POST'])
def add_donation():
    data = request.json
    try:
        conn = get_db_connection()
        if conn is None: return jsonify({"error": "DB connection failed"}), 500
        cursor = conn.cursor()
        # Use the trigger to set expiry_date
        sql = "INSERT INTO donation (donor_id, quantity_ml, donation_date, donation_type) VALUES (%s, %s, %s, 'Blood')"
        args = (data['donor_id'], data['quantity_ml'], data['donation_date'])
        cursor.execute(sql, args)
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Donation added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/organs', methods=['POST'])
def add_organ():
    data = request.json
    try:
        conn = get_db_connection()
        if conn is None: return jsonify({"error": "DB connection failed"}), 500
        cursor = conn.cursor()
        sql = "INSERT INTO organ (donor_id, organ_type, status) VALUES (%s, %s, 'Available')"
        args = (data['donor_id'], data['organ_type'])
        cursor.execute(sql, args)
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Organ added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# --- UPDATE Endpoints (PUT/POST) ---

# --- NEW: Update Donor ---
@app.route('/api/donors/<int:id>', methods=['PUT'])
def update_donor(id):
    data = request.json
    try:
        conn = get_db_connection()
        if conn is None: return jsonify({"error": "DB connection failed"}), 500
        cursor = conn.cursor()
        sql = """
            UPDATE donor SET
            admin_code = %s, name = %s, age = %s, gender = %s, 
            blood_group = %s, contact = %s, medical_history = %s
            WHERE donor_id = %s
        """
        args = (
            data['admin_code'], data['name'], data['age'], data['gender'],
            data['blood_group'], data['contact'], data['medical_history'], id
        )
        cursor.execute(sql, args)
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Donor updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# --- NEW: Update Recipient ---
@app.route('/api/recipients/<int:id>', methods=['PUT'])
def update_recipient(id):
    data = request.json
    try:
        conn = get_db_connection()
        if conn is None: return jsonify({"error": "DB connection failed"}), 500
        cursor = conn.cursor()
        sql = """
            UPDATE recipient SET
            admin_code = %s, name = %s, age = %s, gender = %s, 
            blood_group = %s, organ_required = %s, contact = %s
            WHERE recipient_id = %s
        """
        args = (
            data['admin_code'], data['name'], data['age'], data['gender'],
            data['blood_group'], data['organ_required'], data['contact'], id
        )
        cursor.execute(sql, args)
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Recipient updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/fulfill_blood_request', methods=['POST'])
def fulfill_blood_request():
    data = request.json
    try:
        conn = get_db_connection()
        if conn is None: return jsonify({"error": "DB connection failed"}), 500
        cursor = conn.cursor()
        args = (data['donation_id'], data['request_id'])
        cursor.callproc('sp_FulfillBloodRequest', args)
        result = next(cursor.stored_results()).fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": result[0]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/allocate_organ', methods=['POST'])
def allocate_organ():
    data = request.json
    try:
        conn = get_db_connection()
        if conn is None: return jsonify({"error": "DB connection failed"}), 500
        cursor = conn.cursor()
        
        sql_organ = "UPDATE organ SET request_id = %s, status = 'Transplanted' WHERE organ_id = %s"
        cursor.execute(sql_organ, (data['request_id'], data['organ_id']))
        
        sql_request = "UPDATE requests SET status = 'Fulfilled' WHERE request_id = %s"
        cursor.execute(sql_request, (data['request_id'],))
        
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Organ allocated successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400

# --- DELETE Endpoints ---

@app.route('/api/donors/<int:id>', methods=['DELETE'])
def delete_donor(id):
    try:
        conn = get_db_connection()
        if conn is None: return jsonify({"error": "DB connection failed"}), 500
        cursor = conn.cursor()
        cursor.execute("DELETE FROM donor WHERE donor_id = %s", (id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Donor deleted successfully"}), 200
    except mysql.connector.Error as err:
        if err.errno == 1451:
            return jsonify({"error": "Cannot delete: Donor has existing donations or organs."}), 400
        return jsonify({"error": str(err)}), 400

@app.route('/api/recipients/<int:id>', methods=['DELETE'])
def delete_recipient(id):
    try:
        conn = get_db_connection()
        if conn is None: return jsonify({"error": "DB connection failed"}), 500
        cursor = conn.cursor()
        cursor.execute("DELETE FROM recipient WHERE recipient_id = %s", (id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Recipient deleted successfully"}), 200
    except mysql.connector.Error as err:
        if err.errno == 1451:
            return jsonify({"error": "Cannot delete: Recipient has existing requests."}), 400
        return jsonify({"error": str(err)}), 400

@app.route('/api/requests/<int:id>', methods=['DELETE'])
def delete_request(id):
    try:
        conn = get_db_connection()
        if conn is None: return jsonify({"error": "DB connection failed"}), 500
        cursor = conn.cursor()
        cursor.execute("DELETE FROM requests WHERE request_id = %s", (id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Request deleted successfully"}), 200
    except mysql.connector.Error as err:
        if err.errno == 1451:
            return jsonify({"error": "Cannot delete: Request is linked to a donation or organ."}), 400
        return jsonify({"error": str(err)}), 400

# --- NEW: Inventory DELETE Endpoints ---
@app.route('/api/donations/<int:id>', methods=['DELETE'])
def delete_donation(id):
    try:
        conn = get_db_connection()
        if conn is None: return jsonify({"error": "DB connection failed"}), 500
        cursor = conn.cursor()
        cursor.execute("DELETE FROM donation WHERE donation_id = %s", (id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Donation deleted successfully"}), 200
    except mysql.connector.Error as err:
        if err.errno == 1451:
            return jsonify({"error": "Cannot delete: Donation is linked to a request."}), 400
        return jsonify({"error": str(err)}), 400

@app.route('/api/organs/<int:id>', methods=['DELETE'])
def delete_organ(id):
    try:
        conn = get_db_connection()
        if conn is None: return jsonify({"error": "DB connection failed"}), 500
        cursor = conn.cursor()
        cursor.execute("DELETE FROM organ WHERE organ_id = %s", (id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Organ deleted successfully"}), 200
    except mysql.connector.Error as err:
        if err.errno == 1451:
            return jsonify({"error": "Cannot delete: Organ is allocated to a request."}), 400
        return jsonify({"error": str(err)}), 400

# --- Main entry point ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)