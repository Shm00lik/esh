import asyncio
import os
import asyncpg


async def main():
    conn = await asyncpg.connect(
        user=os.getenv("POSTGRES_USER", "user"),
        password=os.getenv("POSTGRES_PASSWORD", "password"),
        database=os.getenv("POSTGRES_DB", "esh"),
        host=os.getenv("POSTGRES_HOST", "db"),  # Use service name 'db' from docker-compose
        port=os.getenv("POSTGRES_PORT", 5432)
    )

    print("Creating users table...")
    await conn.execute('''
                       CREATE
                       EXTENSION IF NOT EXISTS "uuid-ossp";
                       DROP TABLE IF EXISTS users;
                       CREATE TABLE users
                       (
                           user_id  VARCHAR(36) PRIMARY KEY,
                           user_key VARCHAR(36) NOT NULL UNIQUE,
                           username VARCHAR(50),
                           is_admin BOOLEAN DEFAULT FALSE,
                           esh      INTEGER DEFAULT 100
                       );
                       ''')

    # Create a default admin user for testing
    print("Creating default admin user...")
    admin_key = "admin-secret-key"
    await conn.execute('''
                       INSERT INTO users (user_id, user_key, username, is_admin, esh)
                       VALUES (uuid_generate_v4(), $1, 'admin', TRUE, 10000) ON CONFLICT (user_key) DO NOTHING;
                       ''', admin_key)

    print(f"Default admin user created with key: {admin_key}")

    await conn.close()
    print("Database setup complete.")


if __name__ == "__main__":
    asyncio.run(main())
