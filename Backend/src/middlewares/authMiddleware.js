import { Config } from "../config/config.js";
import JWT from 'jsonwebtoken';
import userModel from "../models/userModel.js";

// Pull the JWT from the Authorization header (cross-domain friendly) or, as a
// fallback, the httpOnly cookie (used in same-site/local setups).
const getToken = (req) => {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) return auth.slice(7);
    return req.cookies?.token || null;
};

export const authSeller = async (req, res, next) => {
    const token = getToken(req);

    if (!token) return res.status(401).json({
        message: "User not authorised",
        success: false,
        error: "No token provided"
    })

    let decodedToken;
    try {
        decodedToken = JWT.verify(token, Config.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({
            message: "Session expired. Please log in again.",
            success: false,
            error: "Invalid or expired token"
        });
    }

    const { userId } = decodedToken;

    // Read the current role from the DB so role changes take effect without a
    // re-login, and a blocked user is rejected immediately.
    const user = await userModel.findById(userId).select('role isBlocked');

    if (!user) return res.status(401).json({
        message: "User not authorised",
        success: false,
        error: "User not found"
    })

    if (user.isBlocked) return res.status(403).json({
        message: "Account is blocked",
        success: false,
        error: "User is blocked"
    })

    if (user.role === 'buyer') return res.status(403).json({
        message: "User not authorised",
        success: false,
        error: "User is not a seller"
    })

    req.user = userId;

    next();
}

export const authAdmin = async (req, res, next) => {
    const token = getToken(req);

    if (!token) return res.status(401).json({
        message: "User not authorised",
        success: false,
        error: "No token provided"
    })

    let decodedToken;
    try {
        decodedToken = JWT.verify(token, Config.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({
            message: "Session expired. Please log in again.",
            success: false,
            error: "Invalid or expired token"
        });
    }

    // Authorise against the current DB role, not the (possibly stale) token role.
    const user = decodedToken?.userId
        ? await userModel.findById(decodedToken.userId).select('role isBlocked')
        : null;

    if (!user || user.role !== 'admin') return res.status(403).json({
        message: "Admin access required",
        success: false,
        error: "User is not an admin"
    })

    if (user.isBlocked) return res.status(403).json({
        message: "Account is blocked",
        success: false,
        error: "User is blocked"
    })

    req.user = decodedToken.userId;

    next();
}

export const verifyToken = async (req, res, next) => {
    const token = getToken(req);

    if (!token) return res.status(401).json({
        message: "Token not provided",
        success: false,
        error: "No token provided"
    })

    let decodedToken;
    try {
        decodedToken = JWT.verify(token, Config.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({
            message: "Session expired. Please log in again.",
            success: false,
            error: "Invalid or expired token"
        });
    }

    req.user = decodedToken.userId;

    next();
}

export const verifySessionId = async (req, res, next) => {
    // Prefer an explicit token (URL/body/header) over the cookie, because the
    // reset page is on a different domain than the API and cross-site cookies
    // are unreliable. Falls back to the cookie for backward compatibility.
    const bearer = req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null;
    const sessionId = bearer || req.body?.token || req.query?.token || req.cookies?.sessionId;

    if (!sessionId) {
        return res.status(403).json({
            message: "SessionId not found",
            success: false,
            error: "SessionId not found"
        });
    }

    try {
        const { clientEmail } = JWT.verify(sessionId, Config.JWT_SECRET);

        if (!clientEmail) {
            return res.status(403).json({
                message: "Invalid SessionId",
                success: false,
                error: "SessionId is invalid"
            });
        }

        req.clientEmail = clientEmail;
        next();
    } catch (error) {
        return res.status(403).json({
            message: "Reset link is invalid or has expired",
            success: false,
            error: "SessionId is invalid"
        });
    }
}