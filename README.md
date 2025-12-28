# **Blood and Organ Bank Management System**

A full-stack web application designed to automate the lifecycle of blood and organ donations, ensuring data integrity and efficient inventory tracking.

## **Features**

* **Real-time Dashboard:** Displays live statistics for pending requests, available organs, and total donor counts.  
* **Inventory Automation:** Uses database triggers to automatically calculate blood unit expiry dates upon entry.  
* **Transactional Fulfillment:** Implements stored procedures to securely link available inventory to patient requests.  
* **Relational Management:** Full CRUD capabilities for Donors, Recipients, Hospitals, and Administrators with complex SQL joins for data visibility.

## **Tech Stack**

* **Frontend:** React.js, Axios, React-Router  
* **Backend:** Python, Flask, Flask-CORS  
* **Database:** MySQL (Stored Procedures, Triggers, Views, Functions)

## **Installation & Setup**

### **Backend Setup**

1. Navigate to the backend directory: cd backend  
2. Create and activate a virtual environment:  
   python \-m venv venv  
   .\\venv\\Scripts\\activate

3. Install dependencies: pip install flask mysql-connector-python flask-cors  
4. Run the server: python app.py

### **Frontend Setup**

1. Navigate to the frontend directory: cd blood\_bank\_frontend  
2. Install Node modules: npm install  
3. Start the application: npm start

## **Database Schema**

The system utilizes a relational schema consisting of 8 tables and 1 view:

* **Core:** admin, hospital, donor, recipient  
* **Inventory & Requests:** donation, organ, requests  
* **Logging:** donation\_request (M:N mapping)  
* **Analytics:** donor\_activity (View)
