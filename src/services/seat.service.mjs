import pool from "../configs/database.mjs";

// get all seats
export const getAllSeats = async () => {
    const result = await pool.query("SELECT * FROM seats");
    return result.rows;
};

// book a seat using a transaction with row locking
export const bookSeat = async (seatId, name, userId) => {
    const conn = await pool.connect();
    try {
        await conn.query("BEGIN");

        // lock the row so no one else can book it at the same time
        const sql = "SELECT * FROM seats WHERE id = $1 AND isbooked = 0 FOR UPDATE";
        const result = await conn.query(sql, [seatId]);

        if (result.rowCount === 0) {
            await conn.query("ROLLBACK");
            const error = new Error("Seat already booked");
            error.statusCode = 409;
            throw error;
        }

        const sqlU = "UPDATE seats SET isbooked = 1, name = $2, user_id = $3 WHERE id = $1 RETURNING *";
        const updateResult = await conn.query(sqlU, [seatId, name, userId]);

        await conn.query("COMMIT");
        return { message: "Seat booked successfully", seat: updateResult.rows[0] };
    } catch (ex) {
        await conn.query("ROLLBACK");
        throw ex;
    } finally {
        conn.release();
    }
};
