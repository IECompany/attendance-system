const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Make sure you have this in your .env file
const JWT_SECRET = process.env.JWT_SECRET || 'your_very_secret_jwt_key';

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, JWT_SECRET);

            // Find user by ID from the token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Attach companyId to the request for easy access
            req.companyId = req.user.companyId || null;

            next();
        } catch (error) {
            console.error("Token verification failed:", error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorize = (...allowedUserTypes) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        
        // Check if the user's role is in the list of allowed roles
        if (!allowedUserTypes.includes(req.user.userType)) {
            return res.status(403).json({ message: 'Access denied: You do not have the required role.' });
        }

        next();
    };
};

module.exports = { protect, authorize };