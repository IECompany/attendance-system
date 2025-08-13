// generate_hash.js

const bcrypt = require('bcryptjs');

async function generateSuperAdminPasswordHash(password) {
    try {
        const saltRounds = 10; // Use the same salt rounds as your registration
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log("Your Super Admin Hashed Password:");
        console.log(hashedPassword); // This will now correctly print the hash
    } catch (error) {
        console.error("Error hashing password:", error);
    }
}

// ✅ IMPORTANT: Call the async function and handle its promise
// This ensures the function completes before the script exits.
generateSuperAdminPasswordHash('Nectar@2025')
    .then(() => {
        // You might see a blank line or similar after the hash, which is normal.
        // The .then() is primarily to catch unhandled rejections if bcrypt.hash fails
        // and to keep the Node.js process alive long enough.
    })
    .catch(err => {
        console.error("An error occurred during password generation:", err);
    });

