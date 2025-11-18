# db_config.py
import mysql.connector
from mysql.connector import Error, connect

def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="DataBasePassword",
            database="blood_bank_db_v2"
        )
        return conn
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None
