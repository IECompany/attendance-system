const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    erpId: { type: String, required: true }, // User's name
    occupation: { type: String }, // Optional for Check-out
    state: { type: String },     // Optional for Check-out
    district: { type: String },  // Optional for Check-out
    dccb: { type: String },      // Optional for Check-out
    latitude: { type: String, required: true }, // Changed to String to accommodate 'N/A'
    longitude: { type: String, required: true }, // Changed to String
    locationName: { type: String, required: true },
    submissionType: { type: String, required: true, enum: ['Check-in', 'Check-out'] }, // To differentiate submission type
    
    // For Check-in photos (array of objects for label and URL)
    photos: [{
        label: String,
        url: String
    }],
    
    // For Check-out photo (single photo URL)
    checkoutPhotoUrl: { type: String },
    
    submissionDate: { type: Date, default: Date.now } // Consistent date field
});

module.exports = mongoose.model('Submission', submissionSchema);