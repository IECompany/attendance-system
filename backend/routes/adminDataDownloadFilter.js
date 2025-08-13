// routes/adminDataDownloadFilter.js - UPDATED AND COMPLETE CODE
const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit'); // ✅ Make sure this path to your Visit model is correct

// --- GET /visits - Fetch Filtered Visit Data for the Admin Panel Table ---
// This route is called by your AdminPanel.jsx to display data in the table.
router.get("/visits", async (req, res) => {
  try {
    const { erpId, district, state, date, status } = req.query;
    let query = {};

    if (erpId) {
      // Use a regular expression for partial match on erpId (case-insensitive)
      query.erpId = new RegExp(erpId, 'i'); 
    }
    if (district) {
      query['checkin.district'] = district; // Filter on checkin.district
    }
    if (state) {
      query['checkin.state'] = state; // Filter on checkin.state
    }
    if (status) {
        query.status = status; // Filter by 'active' or 'completed'
    }
    if (date) {
        // For date, match entries where checkin.date falls within the provided YYYY-MM-DD
        // This assumes checkin.date is stored in ISO format (e.g., "2024-06-16T10:30:00.000Z")
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0); // Set to start of the day in UTC
        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999); // Set to end of the day in UTC

        query['checkin.date'] = {
            $gte: startOfDay,
            $lte: endOfDay
        };
    }

    // Fetch visits, sort by latest check-in date, and populate any necessary refs if you have them
    const visits = await Visit.find(query).sort({ 'checkin.date': -1 }); 
    res.status(200).json(visits);
  } catch (err) {
    console.error("Error fetching admin visits:", err);
    res.status(500).json({ message: "Failed to fetch admin visit data." });
  }
});

// --- GET /unique-checkin-dates - Fetch Unique Check-in Dates for Filter Dropdown ---
router.get("/unique-checkin-dates", async (req, res) => {
    try {
        // Get distinct checkin.date values (these will be Date objects)
        const uniqueDates = await Visit.distinct('checkin.date'); 
        
        // Convert to 'YYYY-MM-DD' strings and ensure uniqueness, then sort
        const formattedDates = [...new Set(uniqueDates.map(date => {
            if (date instanceof Date && !isNaN(date)) {
                return date.toISOString().slice(0, 10);
            }
            return null; // Handle invalid date values if any
        }).filter(Boolean))]; // Filter out nulls

        res.status(200).json(formattedDates.sort().reverse()); // Sort descending
    } catch (err) {
        console.error("Error fetching unique check-in dates:", err);
        res.status(500).json({ message: "Failed to fetch unique check-in dates." });
    }
});

// --- GET /download-csv - Download Filtered Data as CSV ---
// This route handles all CSV downloads (filtered, by ERP ID, or entire dataset)
router.get("/download-csv", async (req, res) => {
    try {
        const { erpId, district, state, date, status } = req.query;
        let query = {};

        if (erpId) {
            query.erpId = new RegExp(erpId, 'i'); // Case-insensitive partial match for ERP ID
        }
        if (district) {
            query['checkin.district'] = district;
        }
        if (state) {
            query['checkin.state'] = state;
        }
        if (status) {
            query.status = status;
        }
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setUTCHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setUTCHours(23, 59, 59, 999);

            query['checkin.date'] = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }

        const visits = await Visit.find(query).sort({ 'checkin.date': -1 }).lean(); // Use .lean() for plain JS objects for performance
        
        if (visits.length === 0) {
            return res.status(404).send("No data found for the selected filters to download.");
        }

        // Prepare CSV headers
        const csvHeaders = [
            'ERP ID', 'Status',
            'Check-in Date & Time', 'Check-in Location', 'Check-in Latitude', 'Check-in Longitude',
            'Check-in Occupation', 'Check-in State', 'Check-in District', 'Check-in DCCB',
            'Check-in Photo 1 URL', 'Check-in Photo 2 URL', 'Check-in Photo 3 URL', // URLs for photos
            'Checkout Date & Time', 'Checkout Location', 'Checkout Latitude', 'Checkout Longitude', 'Checkout Photo URL'
        ];

        // Prepare CSV rows
        const csvRows = visits.map(visit => {
            const checkinPhotos = visit.checkin.photos || [];
            // Map up to 3 photo URLs, padding with empty strings if less than 3
            const photoUrls = checkinPhotos.slice(0, 3).map(p => p.url).concat(
                Array(Math.max(0, 3 - checkinPhotos.length)).fill('')
            );

            return [
                visit.erpId || 'N/A',
                visit.status || 'N/A',
                visit.checkin.date ? new Date(visit.checkin.date).toLocaleString() : 'N/A',
                visit.checkin.locationName || 'N/A',
                visit.checkin.latitude || 'N/A',
                visit.checkin.longitude || 'N/A',
                visit.checkin.occupation || 'N/A',
                visit.checkin.state || 'N/A',
                visit.checkin.district || 'N/A',
                visit.checkin.dccb || 'N/A',
                photoUrls[0] || '', // Photo 1 URL
                photoUrls[1] || '', // Photo 2 URL
                photoUrls[2] || '', // Photo 3 URL
                visit.checkout && visit.checkout.date ? new Date(visit.checkout.date).toLocaleString() : 'N/A',
                visit.checkout && visit.checkout.locationName ? visit.checkout.locationName : 'N/A',
                visit.checkout && visit.checkout.latitude ? visit.checkout.latitude : 'N/A',
                visit.checkout && visit.checkout.longitude ? visit.checkout.longitude : 'N/A',
                visit.checkout && visit.checkout.photoUrl ? visit.checkout.photoUrl : 'N/A'
            ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','); // Escape double quotes and join with comma
        });

        const csvContent = [
            csvHeaders.map(header => `"${header}"`).join(','), // Quote headers too
            ...csvRows
        ].join('\n');

        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename="visits_data.csv"');
        res.status(200).send(csvContent);

    } catch (err) {
        console.error("Error generating CSV:", err);
        res.status(500).send("Failed to generate CSV data.");
    }
});

module.exports = router;