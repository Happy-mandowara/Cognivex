import sqlite3

conn = sqlite3.connect('medikiosk.db')
cursor = conn.cursor()

def add_col(table, col_def):
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col_def}")
        print(f"Added {col_def} to {table}")
    except sqlite3.OperationalError as e:
        print(f"{table} {col_def}: {e}")

add_col('patients', 'dob VARCHAR(32)')
add_col('patients', "abha_status VARCHAR(32) DEFAULT 'NOT_VERIFIED'")
add_col('patients', 'abha_otp VARCHAR(16)')

add_col('documents', 'file_path VARCHAR(256)')
add_col('documents', 'file_size INTEGER DEFAULT 0')
add_col('documents', "mime_type VARCHAR(64) DEFAULT 'application/pdf'")
add_col('documents', "status VARCHAR(32) DEFAULT 'UPLOADED'")

conn.commit()
conn.close()
print("Migration completed.")
