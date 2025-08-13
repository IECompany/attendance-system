// frontend/src/pages/MainDashboard.jsx - UPDATED for Multi-Tenancy

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SubmissionTable from "../components/SubmissionTable"; // Ensure this path is correct
import { FaCamera } from "react-icons/fa";
import imageCompression from "browser-image-compression";
import Select from "react-select"; // Import react-select
import UserVisitsTable from '../components/UserVisitsTable'; // Assuming this is used elsewhere or will be updated

import { useAuth } from '../authContext'; // <-- NEW: Import useAuth context

// Define invalidLocations here, outside of any function scope
const INVALID_LOCATIONS = [
  "Location not available",
  "Unknown Location",
  "Fetching location..."
];

const MainDashboard = () => {
  const { user, token, logout } = useAuth(); // <-- NEW: Get user, token, and logout from AuthContext

  const [showAttendancePanel, setShowAttendancePanel] = useState(false);
  const [showCheckinCheckoutSelection, setShowCheckinCheckoutSelection] = useState(false);
  const [isCheckin, setIsCheckin] = useState(true); // Default to Check-in for initial form display logic

  // --- Photos and Camera State ---
  const [photos, setPhotos] = useState([]);
  const [currentLabelIndex, setCurrentLabelIndex] = useState(0);
  const [cameraFacingMode, setCameraFacingMode] = useState("environment");
  const videoRef = useRef(null); 
  const canvasRef = useRef(null);

  // Dynamic REQUIRED_PHOTOS based on occupation
  const [requiredPhotosCheckin, setRequiredPhotosCheckin] = useState(["Your Front Photo"]);
  // Dynamic REQUIRED_PHOTOS for Checkout
  const [requiredPhotosCheckout, setRequiredPhotosCheckout] = useState(["Your Front Photo"]);

  // --- Location State ---
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [locationName, setLocationName] = useState("Fetching location...");

  // --- Form Data States ---
  const [selectedOffice, setSelectedOffice] = useState(null); 
  const [officeOptions, setOfficeOptions] = useState([]);
  const [selectedState, setSelectedState] = useState(null); 
  const [stateOptions, setStateOptions] = useState([]); 
  const [occupation, setOccupation] = useState(""); 
  const [occupationOptions, setOccupationOptions] = useState([]); 
  // Bike Meter Reading State
  const [bikeMeterReadingCheckin, setBikeMeterReadingCheckin] = useState("");
  const [bikeMeterReadingCheckout, setBikeMeterReadingCheckout] = useState("");
  // Flag to remember if check-in was for SE with meter (for conditional checkout)
  const [checkedInAsSEWithMeter, setCheckedInAsSEWithMeter] = useState(false);

  // --- UI/Loading States ---
  const [viewAttendance, setViewAttendance] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [bgColor, setBgColor] = useState("#e3f2fd");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false); 
  const [fetchingOccupations, setFetchingOccupations] = useState(false); 
  const [fetchingOffices, setFetchingOffices] = useState(false); 
  const [fetchingStates, setFetchingStates] = useState(false); 

  // --- NEW: Helper to get authenticated headers ---
  const getAuthHeaders = useCallback(() => {
    if (!token || !user || !user.companyId) {
      // If token or companyId is missing, it means user is not properly authenticated
      // or session is invalid. Redirect to login.
      alert("Session expired or invalid. Please log in again.");
      logout(); // Use logout function from context
      return null;
    }
    return {
      'Authorization': `Bearer ${token}`,
      'X-Company-ID': user.companyId
    };
  }, [token, user, logout]); // Dependencies for useCallback


  // Utility function to convert Data URL to Blob for FormData
  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  // --- Initial Setup and Effects ---
  useEffect(() => {
    // Check if user is authenticated via context. If not, redirect.
    if (!user || !token || !user.companyId) {
      logout(); // Redirect to login
      return;
    }

    const storedUserName = localStorage.getItem("userName");
    if (storedUserName) setUserName(storedUserName);

    // Load checkedInAsSEWithMeter flag from localStorage
    const storedSEFlag = localStorage.getItem("checkedInAsSEWithMeter");
    if (storedSEFlag === "true") {
      setCheckedInAsSEWithMeter(true);
    } else {
      setCheckedInSEWithMeter(false); // Ensure it's false if not explicitly true
    }

    const hour = new Date().getHours();
    setGreeting(
      hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening"
    );
    setBgColor("#e3f2fd");

    captureLocation();
  }, [user, token, logout]); // Add user and token to dependencies


  // EFFECT: Fetch occupations when component mounts
  useEffect(() => {
    const fetchOccupations = async () => {
      const headers = getAuthHeaders(); // <-- NEW: Get authenticated headers
      if (!headers) return; // Exit if headers are not available

      setFetchingOccupations(true);
      try {
        const response = await fetch("http://localhost:5001/api/occupations", { headers }); // <-- NEW: Pass headers
        if (!response.ok) {
          throw new Error("Failed to fetch occupations");
        }
        const data = await response.json();
        setOccupationOptions(data.map(occ => ({ value: occ.name, label: occ.name }))); // Assuming backend now sends objects { _id, name, companyId }
      } catch (error) {
        console.error("Error fetching occupations:", error);
        alert("Failed to load occupation options. Please check server.");
      } finally {
        setFetchingOccupations(false);
      }
    };
    fetchOccupations();
  }, [getAuthHeaders]); // Re-run when auth headers might change

  // EFFECT: Fetch states when component mounts
  useEffect(() => {
    const fetchStates = async () => {
      const headers = getAuthHeaders(); // <-- NEW: Get authenticated headers
      if (!headers) return; // Exit if headers are not available

      setFetchingStates(true);
      try {
        const response = await fetch("http://localhost:5001/api/states", { headers }); // <-- NEW: Pass headers
        if (!response.ok) {
          throw new Error("Failed to fetch states");
        }
        const data = await response.json();
        // Assuming data is an array of strings like ["Uttar Pradesh", "Chhattisgarh"]
        setStateOptions(data.map(stateName => ({ value: stateName, label: stateName })));
      } catch (error) {
        console.error("Error fetching states:", error);
        alert("Failed to load state options. Please check server.");
      } finally {
        setFetchingStates(false);
      }
    };
    fetchStates();
  }, [getAuthHeaders]); // Re-run when auth headers might change


  // EFFECT: Adjust REQUIRED_PHOTOS for Check-in based on occupation
  useEffect(() => {
    if (occupation === "SE") {
      setRequiredPhotosCheckin([
        "Your Front Photo",
        "Capture your bike meter photo"
      ]);
    } else {
      setRequiredPhotosCheckin(["Your Front Photo"]);
    }
  }, [occupation]);

  // EFFECT: Adjust REQUIRED_PHOTOS for Checkout based on checkedInAsSEWithMeter
  useEffect(() => {
    if (checkedInAsSEWithMeter) {
      setRequiredPhotosCheckout([
        "Your Front Photo",
        "Your bike riding meter"
      ]);
    } else {
      setRequiredPhotosCheckout(["Your Front Photo"]);
    }
  }, [checkedInAsSEWithMeter]);


  // EFFECT: Fetch offices when selectedState changes
  useEffect(() => {
    const fetchOffices = async () => {
      // Clear offices and selected office if no state is selected
      if (!selectedState) {
        setOfficeOptions([]);
        setSelectedOffice(null);
        return;
      }

      const headers = getAuthHeaders(); // <-- NEW: Get authenticated headers
      if (!headers) return; // Exit if headers are not available

      setFetchingOffices(true);
      try {
        // Use the new dedicated route for offices with state filter
        const response = await fetch(`http://localhost:5001/api/offices?state=${encodeURIComponent(selectedState.value)}`, { headers }); // <-- NEW: Pass headers
        if (!response.ok) {
          throw new Error("Failed to fetch offices");
        }
        const data = await response.json();
        // Map data to react-select format: { value: office.name, label: office.name }
        setOfficeOptions(data.map(office => ({ value: office.name, label: office.name, district: office.district }))); // Assuming district might be part of office object
      } catch (error) {
        console.error("Error fetching offices:", error);
        setOfficeOptions([]); // Clear options on error
        alert("Failed to load offices for the selected state. Please check server.");
      } finally {
        setFetchingOffices(false);
      }
    };

    fetchOffices();
  }, [selectedState, getAuthHeaders]); // Re-fetch offices when selectedState or auth headers change

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationName("Geolocation not supported by browser.");
      alert("Your browser does not support location services.");
      return;
    }

    setLocationName("Fetching location...");
    setLocation({ lat: null, lon: null }); // Clear previous location

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        setLocation({ lat: latitude, lon: longitude });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );

          if (!res.ok) throw new Error("Reverse geocoding failed");

          const data = await res.json();
          const address = data.display_name || "Unknown Location";
          setLocationName(address);
        } catch (err) {
          console.error("❌ Reverse geocoding error:", err);
          setLocationName("Unknown Location");
          alert("Unable to determine address from coordinates.");
        }
      },
      (error) => {
        console.error("❌ Geolocation error:", error);
        if (error.code === 1) {
          alert("Permission denied. Please allow location access.");
        } else if (error.code === 2) {
          alert("Position unavailable. Try again later.");
        } else if (error.code === 3) {
          alert("Location request timed out. Please try again.");
        } else {
          alert("An unknown error occurred while fetching location.");
        }
        setLocationName("Location not available");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // --- Main Navigation Handlers ---
  const handleShowAttendance = () => {
    setShowCheckinCheckoutSelection(true); // Show the Check-in/Check-out options
    setShowAttendancePanel(false); // Hide the main attendance panel initially
    setViewAttendance(false);
  };

  // --- Check-in Specific Handlers ---
  const handleCheckinClick = () => {
    setIsCheckin(true); // Set mode to Check-in
    setShowCheckinCheckoutSelection(false); // Hide selection buttons
    setShowAttendancePanel(true); // Show the Check-in form
    setPhotos([]); // Clear photos for a new session
    setCurrentLabelIndex(0); // Reset photo index
    setSelectedOffice(null); // Clear selected office
    setSelectedState(null); // Clear selected state
    setOccupation(""); // Clear selected occupation
    setBikeMeterReadingCheckin(""); // Clear bike meter reading
    setLocationName("Fetching location..."); // Reset location status
    setLocation({ lat: null, lon: null }); // Clear location
    captureLocation(); // Capture location when starting check-in (re-calling for explicit check-in)
  };

  // This function now handles opening camera, capturing, and closing it immediately for Check-in
  const capturePhoto = useCallback(async () => {
    if (INVALID_LOCATIONS.includes(locationName) || !location.lat || !location.lon) {
      alert("Location is not available. Please click 'Refetch Location'.");
      return;
    }
    const requiredPhotos = isCheckin ? requiredPhotosCheckin : requiredPhotosCheckout; // Determine based on current mode
    if (currentLabelIndex >= requiredPhotos.length) {
      alert("All required photos have already been captured.");
      return;
    }

    setLoading(true); // Set loading to true while camera opens and photo is processed
    let stream = null; // Declare stream here to ensure it's accessible in finally block
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 }, // Increased ideal resolution for better quality
          height: { ideal: 1080 },
          facingMode: { ideal: cameraFacingMode }
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to load metadata and start playing
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            resolve();
          };
        });
        // Give a small delay for video frames to become available and show live preview
        await new Promise((resolve) => setTimeout(resolve, 500)); // Half a second delay for live preview
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Add overlay text
      ctx.fillStyle = "white";
      ctx.font = "28px Arial"; // Slightly larger font for better readability
      ctx.shadowColor = "black"; // Add shadow for better contrast
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillText(`📍 ${locationName}`, 20, canvas.height - 70); // Adjusted Y position
      ctx.fillText(`Lat: ${location.lat?.toFixed(5)} | Lon: ${location.lon?.toFixed(5)}`, 20, canvas.height - 40); // Adjusted Y position
      ctx.fillText(`🕒 ${new Date().toLocaleString()}`, 20, canvas.height - 10); // Adjusted Y position

      const photoData = canvas.toDataURL("image/jpeg", 0.9); // Use JPEG and higher quality for better results

      setPhotos((prev) => [
        ...prev,
        { label: requiredPhotos[currentLabelIndex], data: photoData },
      ]);
      setCurrentLabelIndex((prev) => prev + 1);

    } catch (error) {
      console.error("Camera capture error:", error);
      alert("Failed to capture photo. Check camera permissions or ensure no other app is using the camera. Error: " + error.name);
    } finally {
      // Crucially, stop the stream immediately after capture attempt
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null; // Clear the video source
        }
      }
      setLoading(false); // Reset loading state
    }
  }, [currentLabelIndex, location, locationName, cameraFacingMode, isCheckin, requiredPhotosCheckin, requiredPhotosCheckout]); // Dependencies for useCallback

  // This function only changes the preferred camera mode for the next capture (Check-in)
  const toggleCameraFacingMode = () => {
    setCameraFacingMode(prev => (prev === "environment" ? "user" : "environment"));
  };


  const handleCheckoutClick = () => {
    setIsCheckin(false); // Set mode to Check-out
    setShowCheckinCheckoutSelection(false); // Hide selection buttons
    setShowAttendancePanel(true); // Show the checkout processing panel
    setPhotos([]); // Clear photos for checkout
    setCurrentLabelIndex(0); // Reset photo index for checkout
    setBikeMeterReadingCheckout(""); // Clear checkout bike meter reading
    setLocationName("Fetching location..."); // Reset location status
    setLocation({ lat: null, lon: null }); // Clear location
    captureLocationForCheckout(); // Initiate direct checkout process
  };

  const captureLocationForCheckout = () => {
    if (!navigator.geolocation) {
      setLocationName("Geolocation not supported by browser.");
      alert("Your browser does not support location services. Proceeding without location.");
      return;
    }

    setLocationName("Fetching location...");
    setLocation({ lat: null, lon: null });

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        setLocation({ lat: latitude, lon: longitude });
        let resolvedLocationName = `Lat: ${latitude.toFixed(5)} Lon: ${longitude.toFixed(5)}`; // Default to coords

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          if (res.ok) {
            const data = await res.json();
            resolvedLocationName = data.display_name || "Unknown Location";
          } else {
            console.error("Reverse geocoding failed, using coordinates.");
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err, "using coordinates.");
        }
        setLocationName(resolvedLocationName);
      },
      (error) => {
        console.error("❌ Geolocation error during checkout:", error);
        let errorLocationName = "Location not available";
        if (error.code === 1) errorLocationName = "Permission denied";
        alert(`Could not fetch location for checkout: ${errorLocationName}. Proceeding without exact location.`);
        setLocationName(errorLocationName);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleCheckoutSubmission = async () => {
    // Validation for Checkout
    const requiredPhotos = requiredPhotosCheckout;
    if (photos.length < requiredPhotos.length || INVALID_LOCATIONS.includes(locationName)) {
      alert("All required photos must be captured and a valid location must be available.");
      return;
    }
    // Validate bike meter reading if required
    if (checkedInAsSEWithMeter && !bikeMeterReadingCheckout) {
      alert("Please enter your bike meter reading for check-out.");
      return;
    }

    const headers = getAuthHeaders(); // <-- NEW: Get authenticated headers
    if (!headers) return; // Exit if headers are not available

    setLoading(true);
    const compressImage = async (blob) => {
      try {
        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        return await imageCompression(blob, options);
      } catch (error) {
        console.error("Image compression failed:", error);
        return blob;
      }
    };

    const formData = new FormData();
    formData.append("name", userName);
    formData.append("erpId", localStorage.getItem("erpId")); // erpId is login email/pacsId
    formData.append("latitude", location.lat || "N/A");
    formData.append("longitude", location.lon || "N/A");
    formData.append("locationName", locationName);
    formData.append("submissionType", "Check-out");
    formData.append("occupation", localStorage.getItem("lastCheckinOccupation") || "N/A"); // Use stored occupation

    if (checkedInAsSEWithMeter && bikeMeterReadingCheckout) {
      formData.append("bikeMeterReading", bikeMeterReadingCheckout);
    }

    try {
      for (let index = 0; index < photos.length; index++) {
        const { label, data } = photos[index];
        const originalBlob = dataURLtoBlob(data);
        const compressedBlob = await compressImage(originalBlob);
        formData.append("photos", compressedBlob, `${label}-${index + 1}.jpg`);
        formData.append("photoLabels[]", label);
      }

      const response = await fetch("http://localhost:5001/api/erp-submission", {
        method: "POST",
        headers: { // <-- NEW: Add headers for authentication
            'Authorization': headers.Authorization,
            'X-Company-ID': headers['X-Company-ID']
        },
        body: formData,
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (response.ok) {
          alert("✅ Check-out submitted successfully!");
          setShowAttendancePanel(false);
          setShowCheckinCheckoutSelection(true);
          localStorage.removeItem("checkedInAsSEWithMeter");
          localStorage.removeItem("lastCheckinOccupation");
        } else {
          alert("❌ Check-out failed: " + data.message);
        }
      } else {
        const text = await response.text();
        console.error("Unexpected response:", text);
        alert("Unexpected response from server (not JSON). Check the backend route.");
      }

    } catch (error) {
      console.error("Final Check-out submission error:", error);
      alert("An error occurred during check-out process.");
    } finally {
      setLoading(false);
    }
  };

  // --- Check-in Form Submission Handler ---
  const handleSubmit = async () => {
    // Validation for Check-in
    const requiredPhotos = requiredPhotosCheckin;
    if (
      !userName ||
      !occupation ||
      !selectedState ||
      !selectedOffice ||
      photos.length < requiredPhotos.length ||
      INVALID_LOCATIONS.includes(locationName)
    ) {
      alert("All fields must be completed and a valid location must be captured before submission.");
      return;
    }

    // Validate bike meter reading for SE check-in
    if (occupation === "SE" && !bikeMeterReadingCheckin) {
      alert("Please enter your bike meter reading.");
      return;
    }

    const headers = getAuthHeaders(); // <-- NEW: Get authenticated headers
    if (!headers) return; // Exit if headers are not available

    setLoading(true);

    const compressImage = async (blob) => {
      try {
        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        return await imageCompression(blob, options);
      } catch (error) {
        console.error("Image compression failed:", error);
        return blob;
      }
    };

    const formData = new FormData();
    formData.append("name", userName);
    formData.append("erpId", localStorage.getItem("erpId")); // erpId is login email/pacsId
    formData.append("occupation", occupation);
    formData.append("state", selectedState.value);
    formData.append("dccb", JSON.stringify(selectedOffice)); // Send the full selectedOffice object as JSON string
    formData.append("latitude", location.lat);
    formData.append("longitude", location.lon);
    formData.append("locationName", locationName);
    formData.append("submissionType", "Check-in");

    if (occupation === "SE" && bikeMeterReadingCheckin) {
      formData.append("bikeMeterReading", bikeMeterReadingCheckin);
    }

    try {
      for (let index = 0; index < photos.length; index++) {
        const { label, data } = photos[index];
        const originalBlob = dataURLtoBlob(data);
        const compressedBlob = await compressImage(originalBlob);
        formData.append("photos", compressedBlob, `${label}-${index + 1}.jpg`);
        formData.append("photoLabels[]", label);
      }

      const response = await fetch("http://localhost:5001/api/erp-submission", {
        method: "POST",
        headers: { // <-- NEW: Add headers for authentication
            'Authorization': headers.Authorization,
            'X-Company-ID': headers['X-Company-ID']
        },
        body: formData,
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();

        if (response.ok) {
          alert(`✅ Check-in submitted successfully!`);
          if (occupation === "SE" && bikeMeterReadingCheckin) {
            localStorage.setItem("checkedInAsSEWithMeter", "true");
            localStorage.setItem("lastCheckinOccupation", occupation);
          } else {
            localStorage.removeItem("checkedInAsSEWithMeter");
            localStorage.removeItem("lastCheckinOccupation");
          }

          setPhotos([]);
          setCurrentLabelIndex(0);
          setSelectedOffice(null);
          setSelectedState(null);
          setOccupation("");
          setBikeMeterReadingCheckin("");
          setShowAttendancePanel(false);
          setShowCheckinCheckoutSelection(true);
        } else {
          alert("❌ Submission failed: " + data.message);
        }
      } else {
        const text = await response.text();
        console.error("Unexpected response:", text);
        alert("Unexpected response from server (not JSON). Check the backend route.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("An error occurred while submitting data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: bgColor, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="app-header d-flex align-items-center px-4" style={{ backgroundColor: "#0d47a1" }}>
        <img
          src="/nectar-logo.png"
          alt="Nectar Logo"
          height={40}
          width={40}
          className="me-2"
        />
        <h4 className="m-0 text-white fw-bold">Nectar Infotel</h4>
      </header>

      <motion.div className="w-100 text-center text-dark py-4 greeting-card-full shadow-sm"
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
        <h5>{greeting}</h5>
      </motion.div>

      <main className="container my-3 flex-grow-1">
        <motion.div className="row justify-content-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }}>
          {!showCheckinCheckoutSelection && !showAttendancePanel && !viewAttendance && (
            <>
              <div className="col-md-6 mb-3">
                <motion.div whileHover={{ scale: 1.05 }} className="card text-center shadow-sm panel-card"
                  onClick={handleShowAttendance} style={{ cursor: "pointer", backgroundColor: "#d0e7ff" }}>
                  <div className="card-body">
                    <h5 className="card-title">Attendance Panel</h5>
                    <p className="card-text">Submit your Attendance Here</p>
                    <button className="btn btn-outline-primary">Start</button>
                  </div>
                </motion.div>
              </div>
              <div className="col-md-6 mb-3">
                <motion.div whileHover={{ scale: 1.05 }} className="card text-center shadow-sm panel-card"
                  onClick={() => { setViewAttendance(true); setShowAttendancePanel(false); setShowCheckinCheckoutSelection(false); }}
                  style={{ cursor: "pointer", backgroundColor: "#d0e7ff" }}>
                  <div className="card-body">
                    <h5 className="card-title">Attendance Submission</h5>
                    <p className="card-text">Check your Attendance Submission history.</p>
                    <button className="btn btn-outline-primary">View Submission</button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </motion.div>

        <AnimatePresence>
          {/* Check-in/Check-out Selection Panel */}
          {showCheckinCheckoutSelection && (
            <motion.div className="row justify-content-center mt-4"
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}>
              <div className="col-md-10">
                <div className="card shadow-sm p-4 panel-card" style={{ backgroundColor: "#e7f0ff" }}>
                  <h4 className="mb-4 text-primary text-center">Choose Your Action</h4>
                  <div className="d-flex justify-content-around mb-3">
                    <button className="btn btn-success btn-lg mx-2" onClick={handleCheckinClick}>Check-in</button>
                    <button className="btn btn-warning btn-lg mx-2" onClick={handleCheckoutClick}>Check-out</button>
                  </div>
                  <button
                    className="btn btn-secondary mt-3"
                    onClick={() => setShowCheckinCheckoutSelection(false)}
                  >
                    Back to Main
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {/* Check-in Form */}
          {showAttendancePanel && isCheckin && (
            <motion.div className="row justify-content-center mt-4"
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}>
              <div className="col-md-10">
                <div className="card shadow-sm p-4 panel-card" style={{ backgroundColor: "#e7f0ff" }}>
                  <h4 className="mb-4 text-primary">Check-in Details</h4>

                  <div className="mb-3">
                    <label className="form-label">Your Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={userName}
                      readOnly
                      disabled
                    />
                  </div>

                  {/* Dynamic Occupation Dropdown */}
                  <div className="mb-3">
                    <label htmlFor="occupation" className="form-label text-primary">Select your occupation</label>
                    <Select
                      id="occupation"
                      options={occupationOptions} // Now an array of {value, label} objects
                      value={occupationOptions.find(opt => opt.value === occupation)} // Find selected object
                      onChange={(option) => setOccupation(option ? option.value : "")} // Set value from option
                      required
                      isDisabled={fetchingOccupations}
                      isLoading={fetchingOccupations}
                      placeholder={fetchingOccupations ? "Loading occupations..." : "Select your occupation"}
                      noOptionsMessage={() => "No occupations found"}
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: '#ced4da',
                          boxShadow: 'none',
                          '&:hover': { borderColor: '#80bdff' }
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isFocused ? '#e7f0ff' : 'white',
                          color: 'black',
                        }),
                      }}
                    />
                  </div>

                  {/* Dynamic State Dropdown using React-Select */}
                  <div className="mb-3">
                    <label htmlFor="stateSelect" className="form-label">Select State</label>
                    <Select
                      id="stateSelect"
                      options={stateOptions}
                      value={selectedState}
                      onChange={(option) => {
                        setSelectedState(option);
                        setSelectedOffice(null);
                        setOfficeOptions([]);
                      }}
                      placeholder={fetchingStates ? "Loading states..." : "Select a State"}
                      isClearable
                      isLoading={fetchingStates}
                      isDisabled={fetchingStates}
                      noOptionsMessage={() => "No states found"}
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: '#ced4da',
                          boxShadow: 'none',
                          '&:hover': { borderColor: '#80bdff' }
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isFocused ? '#e7f0ff' : 'white',
                          color: 'black',
                        }),
                      }}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="dccbName" className="form-label text-primary">
                      Office or DCCB where you are submitting attendance
                    </label>
                    {/* React-Select Component for Offices */}
                    <Select
                      id="dccbName"
                      options={officeOptions}
                      value={selectedOffice}
                      onChange={setSelectedOffice}
                      placeholder={fetchingOffices ? "Loading offices..." : "Search or select Office/DCCB"}
                      isClearable
                      isLoading={fetchingOffices}
                      isDisabled={!selectedState || fetchingOffices}
                      noOptionsMessage={() => !selectedState ? "Select a State first" : "No offices found"}
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: '#ced4da',
                          boxShadow: 'none',
                          '&:hover': { borderColor: '#80bdff' }
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isFocused ? '#e7f0ff' : 'white',
                          color: 'black',
                        }),
                      }}
                    />
                  </div>

                  {/* Bike Meter Reading Input for SE */}
                  {occupation === "SE" && (
                    <div className="mb-3">
                      <label htmlFor="bikeMeterReadingCheckin" className="form-label text-primary">
                        Enter your bike meter reading
                      </label>
                      <input
                        type="number"
                        id="bikeMeterReadingCheckin"
                        className="form-control"
                        value={bikeMeterReadingCheckin}
                        onChange={(e) => setBikeMeterReadingCheckin(e.target.value)}
                        placeholder="e.g., 12345 km"
                        required
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Capture Photos</label>
                    <div className="p-3 border rounded bg-light">
                      {/* Use dynamic requiredPhotosCheckin here */}
                      {currentLabelIndex < requiredPhotosCheckin.length ? (
                        <>
                          <div
                            className="camera-label-box d-flex align-items-center mb-3 p-3 bg-white shadow-sm rounded"
                            style={{ width: "100%" }}
                          >
                            <FaCamera size={40} color="#0d6efd" className="me-3" />
                            <h5 className="mb-0">{requiredPhotosCheckin[currentLabelIndex]}</h5>
                          </div>
                          <div className="camera-preview-container mb-3 position-relative">
                            {loading && (
                              <div className="spinner-overlay d-flex justify-content-center align-items-center">
                                <div className="spinner-border text-primary" role="status">
                                  <span className="visually-hidden">Loading camera...</span>
                                </div>
                              </div>
                            )}
                            <video ref={videoRef} autoPlay playsInline className="w-100 rounded"></video>
                            <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
                          </div>

                          <div className="d-flex justify-content-between mb-3">
                            <button
                              className="btn btn-info btn-sm"
                              onClick={toggleCameraFacingMode}
                              disabled={loading}
                            >
                              Switch Camera ({cameraFacingMode === "environment" ? "Back" : "Front"})
                            </button>
                            <button
                              className="btn btn-primary"
                              onClick={capturePhoto}
                              disabled={loading}
                            >
                              {loading ? "Capturing..." : "Capture Photo"}
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="text-success fw-bold">✅ All required photos captured</p>
                      )}

                      <div className="photo-grid mt-4">
                        {photos.map((p, i) => (
                          <div key={i} className="photo-item card shadow-sm p-2 mb-3">
                            <div className="photo-label">{p.label}</div>
                            <img src={p.data} alt={p.label} className="img-fluid rounded" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <strong>📍 Current Location:</strong> {locationName} <br />
                    <small>
                      Latitude: {location.lat?.toFixed(5) || "--"} | Longitude: {location.lon?.toFixed(5) || "--"}
                    </small>
                    <br />
                    <button className="btn btn-sm btn-link p-0 mt-1" onClick={captureLocation}>Refetch Location</button>
                  </div>

                  <button
                    className="btn btn-primary w-100 mt-3 d-flex align-items-center justify-content-center"
                    onClick={handleSubmit}
                    disabled={
                      photos.length < requiredPhotosCheckin.length ||
                      loading ||
                      !occupation ||
                      !selectedOffice ||
                      !selectedState ||
                      INVALID_LOCATIONS.includes(locationName) ||
                      (occupation === "SE" && !bikeMeterReadingCheckin)
                    }
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Submitting...
                      </>
                    ) : (
                      "Submit Check-in"
                    )}
                  </button>
                  <button
                    className="btn btn-secondary w-100 mt-2"
                    onClick={() => { setShowAttendancePanel(false); setShowCheckinCheckoutSelection(true); }}
                  >
                    Back
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Checkout Processing Panel - Updated for conditional photos/meter */}
          {showAttendancePanel && !isCheckin && (
            <motion.div className="row justify-content-center mt-4"
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}>
              <div className="col-md-10">
                <div className="card shadow-sm p-4 panel-card text-center" style={{ backgroundColor: "#ffe0b2" }}>
                  <h4 className="mb-3 text-warning">Check-out Details</h4>

                  <div className="mb-3">
                    <strong>📍 Current Location:</strong> {locationName} <br />
                    <small>
                      Latitude: {location.lat?.toFixed(5) || "--"} | Longitude: {location.lon?.toFixed(5) || "--"}
                    </small>
                    <br />
                    <button className="btn btn-sm btn-link p-0 mt-1" onClick={captureLocationForCheckout}>Refetch Location</button>
                  </div>

                  {/* Bike Meter Reading Input for SE Checkout */}
                  {checkedInAsSEWithMeter && (
                    <div className="mb-3">
                      <label htmlFor="bikeMeterReadingCheckout" className="form-label text-warning">
                        Enter your bike meter riding
                      </label>
                      <input
                        type="number"
                        id="bikeMeterReadingCheckout"
                        className="form-control"
                        value={bikeMeterReadingCheckout}
                        onChange={(e) => setBikeMeterReadingCheckout(e.target.value)}
                        placeholder="e.g., 54321 km"
                        required
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Capture Photos</label>
                    <div className="p-3 border rounded bg-light">
                      {/* Use dynamic requiredPhotosCheckout here */}
                      {currentLabelIndex < requiredPhotosCheckout.length ? (
                        <>
                          <div
                            className="camera-label-box d-flex align-items-center mb-3 p-3 bg-white shadow-sm rounded"
                            style={{ width: "100%" }}
                          >
                            <FaCamera size={40} color="#ffc107" className="me-3" />
                            <h5 className="mb-0">{requiredPhotosCheckout[currentLabelIndex]}</h5>
                          </div>
                          <div className="camera-preview-container mb-3 position-relative">
                            {loading && (
                              <div className="spinner-overlay d-flex justify-content-center align-items-center">
                                <div className="spinner-border text-warning" role="status">
                                  <span className="visually-hidden">Loading camera...</span>
                                </div>
                              </div>
                            )}
                            <video ref={videoRef} autoPlay playsInline className="w-100 rounded"></video>
                            <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
                          </div>

                          <div className="d-flex justify-content-between mb-3">
                            <button
                              className="btn btn-info btn-sm"
                              onClick={toggleCameraFacingMode}
                              disabled={loading}
                            >
                              Switch Camera ({cameraFacingMode === "environment" ? "Back" : "Front"})
                            </button>
                            <button
                              className="btn btn-warning"
                              onClick={capturePhoto}
                              disabled={loading}
                            >
                              {loading ? "Capturing..." : "Capture Photo"}
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="text-success fw-bold">✅ All required photos captured</p>
                      )}

                      <div className="photo-grid mt-4">
                        {photos.map((p, i) => (
                          <div key={i} className="photo-item card shadow-sm p-2 mb-3">
                            <div className="photo-label">{p.label}</div>
                            <img src={p.data} alt={p.label} className="img-fluid rounded" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn btn-warning w-100 mt-3 d-flex align-items-center justify-content-center"
                    onClick={handleCheckoutSubmission}
                    disabled={
                      photos.length < requiredPhotosCheckout.length ||
                      loading ||
                      INVALID_LOCATIONS.includes(locationName) ||
                      (checkedInAsSEWithMeter && !bikeMeterReadingCheckout)
                    }
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Submitting Check-out...
                      </>
                    ) : (
                      "Submit Check-out"
                    )}
                  </button>
                  <button
                    className="btn btn-secondary w-100 mt-2"
                    onClick={() => { setShowAttendancePanel(false); setShowCheckinCheckoutSelection(true); }}
                    disabled={loading}
                  >
                    Back
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* View Attendance Panel */}
          {viewAttendance && (
            <motion.div className="row justify-content-center mt-4"
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}>
              <div className="col-md-12">
                <div className="card shadow-sm p-4 panel-card" style={{ backgroundColor: "#e7f0ff" }}>
                  <h4 className="mb-4 text-primary">Attendance Submission History</h4>
                  {/* Pass erpId to SubmissionTable if it needs to filter by user */}
                  <SubmissionTable erpId={user?.email || localStorage.getItem("erpId")} /> {/* Ensure erpId is passed */}
                  <button
                    className="btn btn-secondary w-100 mt-3"
                    onClick={() => setViewAttendance(false)}
                  >
                    Back to Main
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="footer mt-auto py-3 text-center text-dark" style={{ backgroundColor: "#e3f2fd" }}>
        <p className="m-0">&copy; 2024 Nectar Infotel. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MainDashboard;
