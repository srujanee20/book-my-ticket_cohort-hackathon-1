import pool from "../configs/database.mjs";
import bcrypt from "bcrypt";

// find user by email
export const findUserByEmail = async (email) => {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    return result.rowCount > 0 ? result.rows[0] : null;
};

// find user by id (excludes password)
export const findUserById = async (id) => {
    const result = await pool.query(
        "SELECT id, name, email, role FROM users WHERE id = $1",
        [id]
    );
    return result.rowCount > 0 ? result.rows[0] : null;
};

// create a new user, password gets hashed before storing
export const createUser = async (name, email, password, role = "user") => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
        [name, email, hashedPassword, role]
    );
    return result.rows[0];
};
