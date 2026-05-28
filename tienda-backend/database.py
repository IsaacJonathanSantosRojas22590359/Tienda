import mysql.connector
from decouple import config

def get_connection():
    return mysql.connector.connect(
        host=config('DB_HOST'),
        port=int(config('DB_PORT')),
        database=config('DB_NAME'),
        user=config('DB_USER'),
        password=config('DB_PASSWORD'),
    )