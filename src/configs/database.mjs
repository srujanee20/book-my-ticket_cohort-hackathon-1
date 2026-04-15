// CREATE TABLE users (
//     id SERIAL PRIMARY KEY,
//     name VARCHAR(255) NOT NULL,
//     email VARCHAR(255) UNIQUE NOT NULL,
//     password VARCHAR(255) NOT NULL,
//     role VARCHAR(50) DEFAULT 'user'
// );
//
// CREATE TABLE auth_tokens (
//     id SERIAL PRIMARY KEY,
//     user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//     refresh_token_hash VARCHAR(255) NOT NULL,
//     created_at TIMESTAMP DEFAULT NOW(),
//     expires_at TIMESTAMP NOT NULL,
//     UNIQUE(user_id, refresh_token_hash)
// );
//
// CREATE TABLE seats (
//     id SERIAL PRIMARY KEY,
//     name VARCHAR(255),
//     isbooked INT DEFAULT 0,
//     user_id INT REFERENCES users(id)
// );
//
// INSERT INTO seats (isbooked)
// SELECT 0 FROM generate_series(1, 20);

import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    max: parseInt(process.env.DB_POOL_MAX_SIZE),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MILLIS),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MILLIS),
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err, client) => {
    console.log(err);
    process.exit(-1);
});

export default pool;