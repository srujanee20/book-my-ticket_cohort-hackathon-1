import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../configs/database.mjs";
import { findUserByEmail, findUserById, createUser } from "./user.service.mjs";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "fallback_refresh_key";

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

// register - check if email exists, then create user
export const registerUser = async (name, email, password, role) => {
    const existing = await findUserByEmail(email);
    if (existing) {
        const error = new Error("Email already registered");
        error.statusCode = 400;
        throw error;
    }

    return await createUser(name, email, password, role);
};

// login - verify credentials, generate tokens, save refresh token hash in db
export const loginUser = async (email, password) => {
    const user = await findUserByEmail(email);
    if (!user) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: "7d" });

    // store hashed refresh token in auth_tokens table
    const hashedRefresh = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await pool.query(
        "INSERT INTO auth_tokens (user_id, refresh_token_hash, expires_at) VALUES ($1, $2, $3)",
        [user.id, hashedRefresh, expiresAt]
    );

    delete user.password;
    return { user, token, refreshToken };
};

// refresh - verify the refresh token, check it exists in db, issue new access token
export const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        const error = new Error("Refresh token missing");
        error.statusCode = 401;
        throw error;
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    const user = await findUserById(decoded.id);
    if (!user) {
        const error = new Error("User no longer exists");
        error.statusCode = 401;
        throw error;
    }

    // check if this refresh token exists and hasn't expired
    const hashedRefresh = hashToken(refreshToken);
    const tokenResult = await pool.query(
        "SELECT * FROM auth_tokens WHERE user_id = $1 AND refresh_token_hash = $2 AND expires_at > NOW()",
        [user.id, hashedRefresh]
    );
    if (tokenResult.rowCount === 0) {
        const error = new Error("Invalid refresh token — please log in again");
        error.statusCode = 401;
        throw error;
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "15m" });
    return { token };
};

// logout - remove refresh token from db (or all tokens if none specified)
export const logoutUser = async (userId, refreshToken) => {
    if (refreshToken) {
        const hashedRefresh = hashToken(refreshToken);
        await pool.query(
            "DELETE FROM auth_tokens WHERE user_id = $1 AND refresh_token_hash = $2",
            [userId, hashedRefresh]
        );
    } else {
        // no specific token? clear all sessions
        await pool.query("DELETE FROM auth_tokens WHERE user_id = $1", [userId]);
    }
};
