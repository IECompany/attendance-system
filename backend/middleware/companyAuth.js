// Attandance System/backend/middleware/companyAuth.js
const jwt = require('jsonwebtoken'); // Assuming you'll use JWTs for authentication
const User = require('../models/User'); // Import User model

// A placeholder for your JWT secret. REPLACE WITH A STRONG, ENVIRONMENT-VARIABLE SECRET!
const JWT_SECRET = process.env.JWT_SECRET || 'your_very_secret_jwt_key';

const protect = async (req, res, next) => {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, JWT_SECRET); // Replace JWT_SECRET

            // Attach user (including companyId) to the request object
            // We fetch the user to ensure it exists and get the latest info
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // If the user has a companyId, attach it. Global super admins might not have one, or have a specific one.
            req.companyId = req.user.companyId; // This is the key for multi-tenancy!

            next();
        } catch (error) {
            console.error("Token verification failed:", error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Middleware to restrict access based on userType and companyId
const authorize = (...userTypes) => {
    return (req, res, next) => {
        // If the user has a companyId, ensure it's provided and valid
        // IMPORTANT: This means Global SuperAdmins (without companyId) need special handling
        // For now, let's assume all authenticated users will have a companyId after company registration
        // Or, if req.user.userType is 'global_superadmin', they bypass companyId check.
        if (!req.companyId && req.user.userType !== 'global_superadmin') { // Assuming 'global_superadmin' is for system-level access
            return res.status(403).json({ message: 'Access denied: Company ID not found for user.' });
        }

        if (!userTypes.includes(req.user.userType)) {
            return res.status(403).json({ message: 'Access denied: You do not have the required role.' });
        }

        next();
    };
};

module.exports = { protect, authorize };