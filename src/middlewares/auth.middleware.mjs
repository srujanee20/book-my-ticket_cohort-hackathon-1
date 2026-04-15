import jwt from "jsonwebtoken";
import { findUserById } from "../services/user.service.mjs";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

// Verifies JWT and attaches user to req
const authenticate = async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        res.status(401).send({ error: "Not authenticated" });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await findUserById(decoded.id);
        if (!user) {
            res.status(401).send({ error: "User no longer exists" });
            return;
        }

        req.user = user;
        next();
    } catch (ex) {
        res.status(401).send({ error: "Invalid token" });
    }
};

export default authenticate;
