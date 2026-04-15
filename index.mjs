import "dotenv/config";
import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";

import authenticate from "./src/middlewares/auth.middleware.mjs";
import validate from "./src/middlewares/validate.middleware.mjs";
import { registerSchema, loginSchema, refreshSchema, logoutSchema } from "./src/validators/auth.validator.mjs";
import { bookSeatSchema } from "./src/validators/seat.validator.mjs";
import { registerUser, loginUser, refreshAccessToken, logoutUser } from "./src/services/auth.service.mjs";
import { getAllSeats, bookSeat } from "./src/services/seat.service.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 8080;

const app = new express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

//get all seats
app.get("/seats", async (req, res) => {
    const seats = await getAllSeats();
    res.send(seats);
});

// register
app.post("/register", validate(registerSchema), async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const user = await registerUser(name, email, password, role);
        res.status(201).send(user);
    } catch (ex) {
        console.log(ex);
        res.status(ex.statusCode || 500).send({ error: ex.message || "Internal Server Error" });
    }
});

// login
app.post("/login", validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await loginUser(email, password);
        res.send(result);
    } catch (ex) {
        console.log(ex);
        res.status(ex.statusCode || 500).send({ error: ex.message || "Internal Server Error" });
    }
});

// refresh token
app.post("/refresh", validate(refreshSchema), async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const result = await refreshAccessToken(refreshToken);
        res.send(result);
    } catch (ex) {
        console.log(ex);
        res.status(ex.statusCode || 401).send({ error: ex.message || "Invalid refresh token" });
    }
});

// logout
app.post("/logout", authenticate, validate(logoutSchema), async (req, res) => {
    try {
        const { refreshToken } = req.body;
        await logoutUser(req.user.id, refreshToken);
        res.send({ message: "Logged out successfully" });
    } catch (ex) {
        console.log(ex);
        res.status(500).send({ error: "Internal Server Error" });
    }
});

//book a seat - give the seatId and your name
app.put("/:id/:name", authenticate, validate(bookSeatSchema, "params"), async (req, res) => {
    try {
        const result = await bookSeat(req.params.id, req.params.name, req.user.id);
        res.send(result);
    } catch (ex) {
        console.log(ex);
        res.status(ex.statusCode || 500).send({ error: ex.message || "Internal Server Error" });
    }
});

app.listen(port, () => console.log("Server starting on port: " + port));
