// Attandance System/backend/routes/submissionRoutes.js - FINAL CORRECTED VERSION WITH SE LOGIC (Hardcoded occupation/office routes removed)
// UPDATED for multi-tenancy

const express = require("express");
const router = express.Router();
const Visit = require("../models/Visit"); // Use the Visit model
const multer = require("multer");
const { Parser } = require("json2csv");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const ImageKit = require("imagekit");

// ImageKit Configuration
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Multer Storage Configuration (for handling files in memory before ImageKit upload)
const upload = multer({ storage: multer.memoryStorage() }).any();

// --- Helper Functions ---
const uploadImageToImageKit = async (fileBuffer, fileName, folder) => {
  try {
    const uploaded = await imagekit.upload({
      file: fileBuffer.toString("base64"), // Convert buffer to base64 string
      fileName: fileName,
      folder: folder,
    });
    return uploaded.url;
  } catch (error) {
    console.error("ImageKit upload error:", error);
    throw new Error("Failed to upload image to ImageKit.");
  }
};

// --- POST /erp-submission - Handle Check-in & Check-out Submissions ---
router.post("/erp-submission", upload, async (req, res) => {
  try {
    const companyId = req.companyId; // <-- NEW: Get companyId from middleware
    if (!companyId) {
      return res.status(403).json({ message: "Company ID missing. Not authorized for this operation." });
    }

    const {
      erpId,
      occupation, // Sent for Check-in
      state,
      dccb, // Will now be stringified JSON from frontend: {value: 'name', label: 'name', district: 'districtName'}
      latitude,
      longitude,
      locationName,
      submissionType, // This key determines the submission type
      bikeMeterReading, // Sent conditionally for SE Check-in/Check-out
      photoLabels = [] // Expected for Check-in photos and potentially Check-out photos for SE
    } = req.body;

    // Convert latitude/longitude to numbers if they come as strings, handle "N/A" and NaN
    const parsedLatitude = parseFloat(latitude);
    const parsedLongitude = parseFloat(longitude);

    // Basic validation common to both submission types, including NaN checks for lat/long
    if (!erpId || !submissionType || !locationName || isNaN(parsedLatitude) || isNaN(parsedLongitude)) {
      return res.status(400).json({ message: "ERP ID, Submission Type, Location Name, and valid numeric Latitude/Longitude are required." });
    }

    // --- Logic for Check-in Submission ---
    if (submissionType === "Check-in") {
      // Parse the dccb object sent from frontend
      let parsedDccb;
      let officeName;
      let officeDistrict = 'N/A'; // Default in case district is not found

      try {
        parsedDccb = JSON.parse(dccb);
        officeName = parsedDccb.label || parsedDccb.value; // Use label or value for office name
        officeDistrict = parsedDccb.district || 'N/A'; // Extract district
      } catch (e) {
        console.warn("Failed to parse DCCB as JSON. Assuming DCCB is just a string.");
        officeName = dccb; // If it's not JSON, assume it's just the name string
      }


      // Check-in specific validation
      if (!occupation || !state || !officeName || !req.files || req.files.length === 0) {
        return res.status(400).json({ message: "For Check-in: Occupation, State, Office/DCCB, and photos are required." });
      }

      const checkinPhotos = [];
      const photoFiles = req.files.filter(file => file.fieldname === 'photos');

      // --- Check-in Photo Count Validation ---
      let expectedPhotoCount = 1; // Default for non-SE
      if (occupation === "SE") {
        expectedPhotoCount = 2; // Two photos for SE
        if (!bikeMeterReading) {
          return res.status(400).json({ message: "For SE Check-in: Bike meter reading is required." });
        }
      }

      if (photoFiles.length !== expectedPhotoCount) {
        return res.status(400).json({
          message: `For Check-in: Exactly ${expectedPhotoCount} photo(s) required for ${occupation} (You provided ${photoFiles.length}).`
        });
      }

      // Upload all check-in photos
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        const label = Array.isArray(photoLabels) && photoLabels[i] ? photoLabels[i] : `Photo ${i + 1}`;
        const imageUrl = await uploadImageToImageKit(file.buffer, `${erpId}-checkin-${label}-${Date.now()}`, "erp-submissions/check-in");
        checkinPhotos.push({ url: imageUrl, label });
      }

      // Create a new Visit document for Check-in
      const newVisit = new Visit({
        companyId: companyId, // <-- NEW: Assign companyId
        erpId,
        checkin: {
          date: new Date(),
          locationName,
          latitude: parsedLatitude,
          longitude: parsedLongitude,
          occupation,
          state,
          district: officeDistrict,
          dccb: officeName,
          photos: checkinPhotos,
          bikeMeterReading: occupation === "SE" ? bikeMeterReading : undefined,
        },
        status: 'active',
      });
      await newVisit.save();
      res.status(201).json({ message: "Check-in successful!", visit: newVisit });

    }
    // --- Logic for Check-out Submission ---
    else if (submissionType === "Check-out") {
      // Find the latest active check-in for this erpId within THIS company
      const latestActiveVisit = await Visit.findOne({ 
        companyId: companyId, // <-- NEW: Filter by companyId
        erpId, 
        status: 'active' 
      }).sort({ 'checkin.date': -1 });

      if (!latestActiveVisit) {
        return res.status(404).json({ message: "No active Check-in found for this ERP ID to Check-out from within your company." });
      }

      const checkoutPhotoFiles = req.files.filter(file => file.fieldname === 'photos');

      const checkoutPhotos = [];
      let expectedCheckoutPhotoCount = 1;

      const checkedInOccupation = latestActiveVisit.checkin.occupation;
      let checkoutBikeMeterReadingRequired = false;

      if (checkedInOccupation === "SE") {
        expectedCheckoutPhotoCount = 2;
        checkoutBikeMeterReadingRequired = true;
      }

      // --- Check-out Photo Count Validation ---
      if (checkoutPhotoFiles.length !== expectedCheckoutPhotoCount) {
        return res.status(400).json({
          message: `For Check-out: Exactly ${expectedCheckoutPhotoCount} photo(s) required (You provided ${checkoutPhotoFiles.length}).`
        });
      }

      // --- Check-out Bike Meter Reading Validation ---
      if (checkoutBikeMeterReadingRequired && (!bikeMeterReading || isNaN(parseFloat(bikeMeterReading)))) {
        return res.status(400).json({ message: "For SE Check-out: Bike meter reading is required and must be a number." });
      }

      // Upload all checkout photos
      for (let i = 0; i < checkoutPhotoFiles.length; i++) {
        const file = checkoutPhotoFiles[i];
        const label = Array.isArray(photoLabels) && photoLabels[i] ? photoLabels[i] : `Checkout Photo ${i + 1}`;
        const imageUrl = await uploadImageToImageKit(file.buffer, `${erpId}-checkout-${label}-${Date.now()}`, "erp-submissions/check-out");
        checkoutPhotos.push({ url: imageUrl, label });
      }

      // Update the existing Visit document with Check-out details
      latestActiveVisit.checkout = {
        date: new Date(),
        locationName,
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        photos: checkoutPhotos,
        bikeMeterReading: checkoutBikeMeterReadingRequired ? bikeMeterReading : undefined,
      };
      latestActiveVisit.status = 'completed'; // Mark visit as completed

      await latestActiveVisit.save();
      res.status(200).json({ message: "Check-out successful!", visit: latestActiveVisit });

    } else {
      return res.status(400).json({ message: "Invalid submissionType provided. Must be 'Check-in' or 'Check-out'." });
    }

  } catch (err) {
    console.error("Error during submission process:", err);
    res.status(500).json({ message: "Server error during submission.", error: err.message });
  }
});

// --- GET /submissions - Fetch All Submissions (Now Visits) for the current company ---
router.get("/submissions", async (req, res) => {
  try {
    const companyId = req.companyId; // <-- NEW: Get companyId from middleware
    if (!companyId) {
      return res.status(403).json({ message: "Company ID missing. Cannot fetch submissions." });
    }

    const visits = await Visit.find({ companyId: companyId }).sort({ 'checkin.date': -1 }); // <-- Filter by companyId
    res.status(200).json(visits);
  } catch (err) {
    console.error("Failed to fetch all visits:", err);
    res.status(500).json({ message: "Failed to fetch visits." });
  }
});

// --- GET /submissions/:erpId - Fetch Visits by ERP ID for the current company ---
router.get("/submissions/:erpId", async (req, res) => {
  try {
    const companyId = req.companyId; // <-- NEW: Get companyId from middleware
    if (!companyId) {
      return res.status(403).json({ message: "Company ID missing. Cannot fetch submissions." });
    }

    const { erpId } = req.params;
    if (!erpId) {
      return res.status(400).json({ message: 'ERP ID is required to view visits.' });
    }
    // Filter visits by companyId and erpId
    const visits = await Visit.find({ companyId: companyId, erpId: erpId }).sort({ 'checkin.date': -1 }); // <-- Filter by companyId
    res.status(200).json(visits);
  } catch (err) {
    console.error("Error fetching ERP visits by ID:", err);
    res.status(500).json({ message: "Error fetching ERP visits." });
  }
});

// --- GET /admin/download-submissions - Admin CSV Download (Filterable by Company) ---
router.get("/admin/download-submissions", async (req, res) => {
  try {
    const companyId = req.companyId; // <-- NEW: Get companyId from middleware
    if (!companyId) {
      return res.status(403).json({ message: "Company ID missing. Cannot download submissions." });
    }

    const { district, state, date, erpId } = req.query;
    const filter = { companyId: companyId }; // <-- NEW: Base filter by companyId

    if (erpId) filter.erpId = erpId;
    if (district) filter['checkin.district'] = district;
    if (state) filter['checkin.state'] = state;

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter['checkin.date'] = { $gte: start, $lt: end };
    }

    const visits = await Visit.find(filter).sort({ 'checkin.date': -1 });

    const csvFields = new Set([
      "ERP ID", "Check-in Date", "Check-in Location", "Check-in Latitude", "Check-in Longitude",
      "Occupation", "State", "District", "Office/DCCB", "Check-in Bike Meter Reading",
      "Checkout Date", "Checkout Location", "Checkout Latitude", "Checkout Longitude", "Checkout Bike Meter Reading",
      "Status"
    ]);

    // Add dynamic photo labels for check-in photos
    visits.forEach(visit => {
      if (visit.checkin && visit.checkin.photos && Array.isArray(visit.checkin.photos)) {
        visit.checkin.photos.forEach(photo => {
          csvFields.add(`Check-in Photo (${photo.label || 'Unnamed'})`);
        });
      }
      // Add dynamic photo labels for checkout photos
      if (visit.checkout && visit.checkout.photos && Array.isArray(visit.checkout.photos)) {
        visit.checkout.photos.forEach(photo => {
          csvFields.add(`Checkout Photo (${photo.label || 'Unnamed'})`);
        });
      }
    });

    const formattedData = visits.map((visit) => {
      const base = {
        "ERP ID": visit.erpId,
        "Check-in Date": visit.checkin.date ? new Date(visit.checkin.date).toLocaleString() : '',
        "Check-in Location": visit.checkin.locationName,
        "Check-in Latitude": visit.checkin.latitude,
        "Check-in Longitude": visit.checkin.longitude,
        "Occupation": visit.checkin.occupation || 'N/A',
        "State": visit.checkin.state || 'N/A',
        "District": visit.checkin.district || 'N/A',
        "Office/DCCB": visit.checkin.dccb || 'N/A',
        "Check-in Bike Meter Reading": visit.checkin.bikeMeterReading || 'N/A',
        "Checkout Date": visit.checkout && visit.checkout.date ? new Date(visit.checkout.date).toLocaleString() : 'Ongoing',
        "Checkout Location": visit.checkout && visit.checkout.locationName ? visit.checkout.locationName : 'N/A',
        "Checkout Latitude": visit.checkout && visit.checkout.latitude ? visit.checkout.latitude : 'N/A',
        "Checkout Longitude": visit.checkout && visit.checkout.longitude ? visit.checkout.longitude : 'N/A',
        "Checkout Bike Meter Reading": visit.checkout && visit.checkout.bikeMeterReading ? visit.checkout.bikeMeterReading : 'N/A',
        "Status": visit.status.charAt(0).toUpperCase() + visit.status.slice(1)
      };

      if (visit.checkin && visit.checkin.photos && Array.isArray(visit.checkin.photos)) {
        visit.checkin.photos.forEach((photo) => {
          base[`Check-in Photo (${photo.label || 'Unnamed'})`] = photo.url;
        });
      }
      if (visit.checkout && visit.checkout.photos && Array.isArray(visit.checkout.photos)) {
        visit.checkout.photos.forEach((photo) => {
          base[`Checkout Photo (${photo.label || 'Unnamed'})`] = photo.url;
        });
      }
      return base;
    });

    const csvParser = new Parser({ fields: Array.from(csvFields) });
    const csv = csvParser.parse(formattedData);

    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    const filePath = path.join(tempDir, `Filtered_ERP_Visits.csv`);
    fs.writeFileSync(filePath, csv);

    res.setHeader("Content-Disposition", `attachment; filename=Filtered_ERP_Visits.csv`);
    res.setHeader("Content-Type", "text/csv");
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("Error sending CSV file:", err);
      }
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error("Error deleting temp CSV file:", unlinkErr);
      });
    });

  } catch (err) {
    console.error("Download CSV error:", err);
    res.status(500).json({ message: "Failed to generate CSV." });
  }
});

// --- GET /admin/download-submissions/:erpId - Admin CSV Download by Specific ERP ID for the current company ---
router.get("/admin/download-submissions/:erpId", async (req, res) => {
  try {
    const companyId = req.companyId; // <-- NEW: Get companyId from middleware
    if (!companyId) {
      return res.status(403).json({ message: "Company ID missing. Cannot download submissions." });
    }

    // Filter visits by companyId and erpId
    const visits = await Visit.find({ companyId: companyId, erpId: req.params.erpId }).sort({ 'checkin.date': -1 });

    if (!visits.length) {
      return res.status(404).json({ message: "No visits found for this ERP ID in your company." });
    }

    const csvFields = new Set([
      "ERP ID", "Check-in Date", "Check-in Location", "Check-in Latitude", "Check-in Longitude",
      "Occupation", "State", "District", "Office/DCCB", "Check-in Bike Meter Reading",
      "Checkout Date", "Checkout Location", "Checkout Latitude", "Checkout Longitude", "Checkout Bike Meter Reading",
      "Status"
    ]);

    visits.forEach(visit => {
      if (visit.checkin && visit.checkin.photos && Array.isArray(visit.checkin.photos)) {
        visit.checkin.photos.forEach(photo => csvFields.add(`Check-in Photo (${photo.label || 'Unnamed'})`));
      }
      if (visit.checkout && visit.checkout.photos && Array.isArray(visit.checkout.photos)) {
        visit.checkout.photos.forEach(photo => csvFields.add(`Checkout Photo (${photo.label || 'Unnamed'})`));
      }
    });

    const formattedData = visits.map(visit => {
      const base = {
        "ERP ID": visit.erpId,
        "Check-in Date": visit.checkin.date ? new Date(visit.checkin.date).toLocaleString() : '',
        "Check-in Location": visit.checkin.locationName,
        "Check-in Latitude": visit.checkin.latitude,
        "Check-in Longitude": visit.checkin.longitude,
        "Occupation": visit.checkin.occupation || 'N/A',
        "State": visit.checkin.state || 'N/A',
        "District": visit.checkin.district || 'N/A',
        "Office/DCCB": visit.checkin.dccb || 'N/A',
        "Check-in Bike Meter Reading": visit.checkin.bikeMeterReading || 'N/A',
        "Checkout Date": visit.checkout && visit.checkout.date ? new Date(visit.checkout.date).toLocaleString() : 'Ongoing',
        "Checkout Location": visit.checkout && visit.checkout.locationName ? visit.checkout.locationName : 'N/A',
        "Checkout Latitude": visit.checkout && visit.checkout.latitude ? visit.checkout.latitude : 'N/A',
        "Checkout Longitude": visit.checkout && visit.checkout.longitude ? visit.checkout.longitude : 'N/A',
        "Checkout Bike Meter Reading": visit.checkout && visit.checkout.bikeMeterReading ? visit.checkout.bikeMeterReading : 'N/A',
        "Status": visit.status.charAt(0).toUpperCase() + visit.status.slice(1)
      };

      if (visit.checkin && visit.checkin.photos && Array.isArray(visit.checkin.photos)) {
        visit.checkin.photos.forEach(photo => {
          base[`Check-in Photo (${photo.label || 'Unnamed'})`] = photo.url;
        });
      }
      if (visit.checkout && visit.checkout.photos && Array.isArray(visit.checkout.photos)) {
        visit.checkout.photos.forEach(photo => {
          base[`Checkout Photo (${photo.label || 'Unnamed'})`] = photo.url;
        });
      }
      return base;
    });

    const csvParser = new Parser({ fields: Array.from(csvFields) });
    const csv = csvParser.parse(formattedData);

    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    const filePath = path.join(tempDir, `${req.params.erpId}_ERP_Visits.csv`);
    fs.writeFileSync(filePath, csv);

    res.setHeader("Content-Disposition", `attachment; filename=${req.params.erpId}_ERP_Visits.csv`);
    res.setHeader("Content-Type", "text/csv");
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("Error sending ERP-specific CSV file:", err);
      }
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error("Error deleting temp ERP CSV file:", unlinkErr);
      });
    });

  } catch (err) {
    console.error("Download ERP CSV error:", err);
    res.status(500).json({ message: "Failed to generate CSV." });
  }
});

// --- GET /download-image - Optional Image Download Proxy ---
router.get("/download-image", async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).send("No image URL provided");

  try {
    const response = await axios({
      url: imageUrl,
      method: "GET",
      responseType: "stream",
    });

    const filename = imageUrl.split("/").pop().split("?")[0] || "image.jpg";
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", response.headers["content-type"] || "application/octet-stream");

    response.data.pipe(res);
  } catch (err) {
    console.error("Image Download Proxy Error:", err.message);
    res.status(500).send("Failed to download image");
  }
});

module.exports = router;