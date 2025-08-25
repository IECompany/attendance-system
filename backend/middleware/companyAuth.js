const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_very_secret_jwt_key';

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            console.log("Decoded token:", decoded);

            req.user = await User.findById(decoded.id).select('-password');
            console.log("User found:", req.user);

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            req.companyId = req.user.companyId || null;
            console.log("User companyId:", req.companyId);

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
        console.log('Authorize middleware:', {
            userType: req.user?.userType,
            companyId: req.companyId,
            allowedUserTypes
        });

        // Superadmins bypass companyId check
        if (
            !req.companyId &&
            !['global_superadmin', 'superadmin'].includes(req.user.userType)
        ) {
            console.log('Access denied: No companyId and user is not superadmin.');
            return res.status(403).json({ message: 'Access denied: Company ID not found for user.' });
        }

        if (!allowedUserTypes.includes(req.user.userType)) {
            console.log('Access denied: User role not allowed.');
            return res.status(403).json({ message: 'Access denied: You do not have the required role.' });
        }

        next();
    };
};

module.exports = { protect, authorize };
