import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCamera, FaSignInAlt, FaCheckCircle, FaExclamationCircle, FaFingerprint, FaSignOutAlt } from "react-icons/fa";
import { FaBuilding, FaMapMarkerAlt, FaFileAlt } from 'react-icons/fa';
import imageCompression from "browser-image-compression";
import Select from "react-select";
import { useAuth } from '../authContext';
import Message from '../components/Message';
import SubmissionTable from "../components/SubmissionTable";

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

// Define invalidLocations here, outside of any function scope
const INVALID_LOCATIONS = [
  "Location not available",
  "Unknown Location",
  "Fetching location..."
];

const MainDashboard = () => {
  const { user, token, logout } = useAuth();

  // --- UI/Loading States ---
  const [showAttendancePanel, setShowAttendancePanel] = useState(false);
  const [showCheckinCheckoutSelection, setShowCheckinCheckoutSelection] = useState(false);
  const [isCheckin, setIsCheckin] = useState(true);
  const [viewAttendance, setViewAttendance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [fetchingOccupations, setFetchingOccupations] = useState(false);
  const [fetchingOffices, setFetchingOffices] = useState(false);
  const [fetchingStates, setFetchingStates] = useState(false);

  // --- User/Greeting States ---
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("");
  const [userERPId, setUserERPId] = useState("");

  // --- Form Data States ---
  const [photos, setPhotos] = useState([]);
  const [currentLabelIndex, setCurrentLabelIndex] = useState(0);
  const [cameraFacingMode, setCameraFacingMode] = useState("environment");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [requiredPhotosCheckin, setRequiredPhotosCheckin] = useState(["Your Front Photo"]);
  const [requiredPhotosCheckout, setRequiredPhotosCheckout] = useState(["Your Front Photo"]);

  const [location, setLocation] = useState({ lat: null, lon: null });
  const [locationName, setLocationName] = useState("Fetching location...");

  const [selectedOffice, setSelectedOffice] = useState(null);
  const [officeOptions, setOfficeOptions] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [stateOptions, setStateOptions] = useState([]);
  const [occupation, setOccupation] = useState("");
  const [occupationOptions, setOccupationOptions] = useState([]);
  const [bikeMeterReadingCheckin, setBikeMeterReadingCheckin] = useState("");
  const [bikeMeterReadingCheckout, setBikeMeterReadingCheckout] = useState("");
  const [checkedInAsSEWithMeter, setCheckedInAsSEWithMeter] = useState(false);

  // --- NEW: Helper to get authenticated headers ---
  const getAuthHeaders = useCallback(() => {
    if (!token || !user || !user.companyId) {
      setMessage({ type: 'error', text: 'Session expired or invalid. Please log in again.' });
      logout();
      return null;
    }
    return {
      'Authorization': `Bearer ${token}`,
      'X-Company-ID': user.companyId
    };
  }, [token, user, logout]);

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
    if (!user || !token || !user.companyId) {
      logout();
      return;
    }

    setUserName(user.name || "User");
    setUserERPId(user.email || user.erpId || "N/A");

    const storedSEFlag = localStorage.getItem("checkedInAsSEWithMeter");
    setCheckedInAsSEWithMeter(storedSEFlag === "true");

    const hour = new Date().getHours();
    setGreeting(
      hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening"
    );

    captureLocation();
  }, [user, token, logout]);

  // EFFECT: Fetch occupations when component mounts
  useEffect(() => {
    const fetchOccupations = async () => {
      const headers = getAuthHeaders();
      if (!headers) return;
      setFetchingOccupations(true);
      try {
        const response = await fetch(`${API_BASE_URL}/occupations`, { headers });
        if (!response.ok) throw new Error("Failed to fetch occupations");
        const data = await response.json();
        setOccupationOptions(data.map(occ => ({ value: occ, label: occ })));
      } catch (error) {
        console.error("Error fetching occupations:", error);
        setMessage({ type: 'error', text: 'Failed to load occupations.' });
      } finally {
        setFetchingOccupations(false);
      }
    };
    fetchOccupations();
  }, [getAuthHeaders]);

  // EFFECT: Fetch states when component mounts
  useEffect(() => {
    const fetchStates = async () => {
      const headers = getAuthHeaders();
      if (!headers) return;
      setFetchingStates(true);
      try {
        const response = await fetch(`${API_BASE_URL}/states`, { headers });
        if (!response.ok) throw new Error("Failed to fetch states");
        const data = await response.json();
        setStateOptions(data.map(stateName => ({ value: stateName, label: stateName })));
      } catch (error) {
        console.error("Error fetching states:", error);
        setMessage({ type: 'error', text: 'Failed to load states.' });
      } finally {
        setFetchingStates(false);
      }
    };
    fetchStates();
  }, [getAuthHeaders]);

  // EFFECT: Adjust REQUIRED_PHOTOS for Check-in based on bikeMeterReadingCheckin
  useEffect(() => {
    const newRequiredPhotos = ["Your Front Photo"];
    if (bikeMeterReadingCheckin) {
      newRequiredPhotos.push("Capture your bike meter photo");
    }
    setRequiredPhotosCheckin(newRequiredPhotos);
  }, [bikeMeterReadingCheckin]);

  // EFFECT: Adjust REQUIRED_PHOTOS for Checkout based on checkedInAsSEWithMeter
  useEffect(() => {
    const newRequiredPhotos = ["Your Front Photo"];
    if (checkedInAsSEWithMeter) {
      newRequiredPhotos.push("Your bike riding meter");
    }
    setRequiredPhotosCheckout(newRequiredPhotos);
  }, [checkedInAsSEWithMeter]);

  // EFFECT: Fetch offices when selectedState changes
  useEffect(() => {
    const fetchOffices = async () => {
      if (!selectedState) {
        setOfficeOptions([]);
        setSelectedOffice(null);
        return;
      }
      const headers = getAuthHeaders();
      if (!headers) return;
      setFetchingOffices(true);
      try {
        const response = await fetch(`${API_BASE_URL}/offices?state=${encodeURIComponent(selectedState.value)}`, { headers });
        if (!response.ok) throw new Error("Failed to fetch offices");
        const data = await response.json();
        setOfficeOptions(data.map(office => ({ value: office.name, label: office.name, district: office.district })));
      } catch (error) {
        console.error("Error fetching offices:", error);
        setOfficeOptions([]);
        setMessage({ type: 'error', text: 'Failed to load offices.' });
      } finally {
        setFetchingOffices(false);
      }
    };
    fetchOffices();
  }, [selectedState, getAuthHeaders]);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationName("Geolocation not supported by browser.");
      setMessage({ type: 'error', text: 'Your browser does not support location services.' });
      return;
    }
    setLocationName("Fetching location...");
    setLocation({ lat: null, lon: null });

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        setLocation({ lat: latitude, lon: longitude });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          if (!res.ok) throw new Error("Reverse geocoding failed");
          const data = await res.json();
          setLocationName(data.display_name || "Unknown Location");
        } catch (err) {
          console.error("❌ Reverse geocoding error:", err);
          setLocationName("Unknown Location");
          setMessage({ type: 'error', text: 'Unable to determine address from coordinates.' });
        }
      },
      (error) => {
        console.error("❌ Geolocation error:", error);
        let errorMsg = "An unknown error occurred while fetching location.";
        if (error.code === 1) errorMsg = "Permission denied. Please allow location access.";
        if (error.code === 2) errorMsg = "Position unavailable. Try again later.";
        if (error.code === 3) errorMsg = "Location request timed out. Please try again.";
        setMessage({ type: 'error', text: errorMsg });
        setLocationName("Location not available");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleShowAttendance = () => {
    setShowCheckinCheckoutSelection(true);
    setShowAttendancePanel(false);
    setViewAttendance(false);
  };

  const handleCheckinClick = () => {
    setIsCheckin(true);
    setShowCheckinCheckoutSelection(false);
    setShowAttendancePanel(true);
    setPhotos([]);
    setCurrentLabelIndex(0);
    setSelectedOffice(null);
    setSelectedState(null);
    setOccupation("");
    setBikeMeterReadingCheckin("");
    setLocationName("Fetching location...");
    setLocation({ lat: null, lon: null });
    captureLocation();
  };

  const handleCheckoutClick = () => {
    setIsCheckin(false);
    setShowCheckinCheckoutSelection(false);
    setShowAttendancePanel(true);
    setPhotos([]);
    setCurrentLabelIndex(0);
    setBikeMeterReadingCheckout("");
    setLocationName("Fetching location...");
    setLocation({ lat: null, lon: null });
    captureLocation();
  };

  const capturePhoto = useCallback(async () => {
    if (INVALID_LOCATIONS.includes(locationName) || !location.lat || !location.lon) {
      setMessage({ type: 'error', text: "Location is not available. Please click 'Refetch Location'." });
      return;
    }
    const requiredPhotos = isCheckin ? requiredPhotosCheckin : requiredPhotosCheckout;
    if (currentLabelIndex >= requiredPhotos.length) {
      setMessage({ type: 'warning', text: "All required photos have already been captured." });
      return;
    }

    setLoading(true);
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: { ideal: cameraFacingMode } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            resolve();
          };
        });
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.font = "28px Arial";
      ctx.shadowColor = "black";
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(`📍 ${locationName}`, 20, canvas.height - 70);
      ctx.fillText(`Lat: ${location.lat?.toFixed(5)} | Lon: ${location.lon?.toFixed(5)}`, 20, canvas.height - 40);
      ctx.fillText(`🕒 ${new Date().toLocaleString()}`, 20, canvas.height - 10);
      const photoData = canvas.toDataURL("image/jpeg", 0.9);
      setPhotos((prev) => [...prev, { label: requiredPhotos[currentLabelIndex], data: photoData }]);
      setCurrentLabelIndex((prev) => prev + 1);
    } catch (error) {
      console.error("Camera capture error:", error);
      setMessage({ type: 'error', text: `Failed to capture photo. Error: ${error.name}` });
    } finally {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
      }
      setLoading(false);
    }
  }, [currentLabelIndex, location, locationName, cameraFacingMode, isCheckin, requiredPhotosCheckin, requiredPhotosCheckout]);

  const toggleCameraFacingMode = () => {
    setCameraFacingMode(prev => (prev === "environment" ? "user" : "environment"));
  };

  const handleCheckoutSubmission = async () => {
    const requiredPhotos = requiredPhotosCheckout;
    if (photos.length < requiredPhotos.length || INVALID_LOCATIONS.includes(locationName)) {
      setMessage({ type: 'error', text: "All required photos must be captured and a valid location must be available." });
      return;
    }
    if (checkedInAsSEWithMeter && !bikeMeterReadingCheckout) {
      setMessage({ type: 'error', text: "Please enter your bike meter reading for check-out." });
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) return;
    setLoading(true);
    const compressImage = async (blob) => {
      try {
        const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true };
        return await imageCompression(blob, options);
      } catch (error) {
        console.error("Image compression failed:", error);
        return blob;
      }
    };

    const formData = new FormData();
    formData.append("name", userName);
    formData.append("erpId", userERPId);
    formData.append("latitude", location.lat || "N/A");
    formData.append("longitude", location.lon || "N/A");
    formData.append("locationName", locationName);
    formData.append("submissionType", "Check-out");
    formData.append("occupation", localStorage.getItem("lastCheckinOccupation") || "N/A");
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
      const response = await fetch(`${API_BASE_URL}/erp-submission`, {
        method: "POST",
        headers: { 'Authorization': headers.Authorization, 'X-Company-ID': headers['X-Company-ID'] },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: "Check-out submitted successfully!" });
        setShowAttendancePanel(false);
        setShowCheckinCheckoutSelection(true);
        localStorage.removeItem("checkedInAsSEWithMeter");
        localStorage.removeItem("lastCheckinOccupation");
      } else {
        setMessage({ type: 'error', text: `Check-out failed: ${data.message}` });
      }
    } catch (error) {
      console.error("Final Check-out submission error:", error);
      setMessage({ type: 'error', text: "An error occurred during check-out process." });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const requiredPhotos = requiredPhotosCheckin;
    if (
      !userName || !occupation || !selectedState || !selectedOffice ||
      photos.length < requiredPhotos.length || INVALID_LOCATIONS.includes(locationName)
    ) {
      setMessage({ type: 'error', text: "All fields must be completed and a valid location must be captured." });
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) return;
    setLoading(true);

    const compressImage = async (blob) => {
      try {
        const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true };
        return await imageCompression(blob, options);
      } catch (error) {
        console.error("Image compression failed:", error);
        return blob;
      }
    };

    const formData = new FormData();
    formData.append("name", userName);
    formData.append("erpId", userERPId);
    formData.append("occupation", occupation);
    formData.append("state", selectedState.value);
    formData.append("dccb", JSON.stringify(selectedOffice));
    formData.append("latitude", location.lat);
    formData.append("longitude", location.lon);
    formData.append("locationName", locationName);
    formData.append("submissionType", "Check-in");

    if (bikeMeterReadingCheckin) {
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

      const response = await fetch(`${API_BASE_URL}/erp-submission`, {
        method: "POST",
        headers: { 'Authorization': headers.Authorization, 'X-Company-ID': headers['X-Company-ID'] },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: "Check-in submitted successfully! ✅" });
        if (bikeMeterReadingCheckin) {
          localStorage.setItem("checkedInAsSEWithMeter", "true");
        } else {
          localStorage.removeItem("checkedInAsSEWithMeter");
        }
        localStorage.setItem("lastCheckinOccupation", occupation);

        setPhotos([]);
        setCurrentLabelIndex(0);
        setSelectedOffice(null);
        setSelectedState(null);
        setOccupation("");
        setBikeMeterReadingCheckin("");
        setShowAttendancePanel(false);
        setShowCheckinCheckoutSelection(true);
      } else {
        setMessage({ type: 'error', text: `Submission failed: ${data.message} ❌` });
      }
    } catch (error) {
      console.error("Submission error:", error);
      setMessage({ type: 'error', text: "An error occurred while submitting data. ⛔" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx="true">{`
        :root {
          /* --- Blue Monochromatic Palette --- */
          --ui-blue-primary: #2962FF;
          --ui-blue-dark: #0D47A1;
          
          /* --- Neutral Colors --- */
          --ui-white: #FFFFFF;
          --ui-dark: #333;
          --ui-gray: #6c757d;
          --ui-dashboard-bg: #f4f7f9;

          /* --- UI Effects --- */
          --box-shadow-light: 0 4px 12px rgba(0,0,0,0.08);
          --transition-speed: 0.3s;
        }
        
        .dashboard-container {
          min-height: 100vh;
          background-color: var(--ui-dashboard-bg);
          background-image: url("data:image/svg+xml,%3Csvg width='42' height='44' viewBox='0 0 42 44' xmlns='http://www.w3.org/2000/svg'%3E%3Cg id='Page-1' stroke='none' stroke-width='1' fill='none' fill-rule='evenodd'%3E%3Cg id='brick-wall' fill='%239e9e9e' fill-opacity='0.05'%3E%3Cpath d='M0,0 L0,44 L21,44 L21,0 L0,0 Z M21,0 L21,22 L42,22 L42,0 L21,0 Z M21,22 L21,44 L42,44 L42,22 L21,22 Z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          font-family: 'Poppins', sans-serif;
          display: flex;
          flex-direction: column;
        }

        .app-header {
          background-color: var(--ui-blue-dark);
          background-image: url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23004d40' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 6V5zm1 5v1H5z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          color: var(--ui-white);
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          border-bottom: 3px solid var(--ui-blue-primary);
          justify-content: space-between;
        }
        
        .app-header h4 {
          margin: 0;
          font-weight: 700;
          font-size: 1.75rem;
        }

        .greeting-card {
          background-image: linear-gradient(45deg, var(--ui-blue-primary), var(--ui-blue-dark));
          color: white;
          padding: 2rem 1rem;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border-radius: 0 0 25px 25px;
          border-bottom: 3px solid var(--ui-blue-primary);
        }
        
        .panel-card {
            background-color: #fff;
            border: none;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            padding: 2.5rem;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .panel-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.2);
        }

        .form-label-custom {
            font-weight: 500;
            color: var(--ui-dark);
        }
        .form-control-custom {
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          padding: 10px 15px;
          transition: all var(--transition-speed);
        }

        .form-control-custom:focus {
          border-color: var(--ui-blue-primary);
          box-shadow: 0 0 0 3px rgba(41, 98, 255, 0.15);
          outline: none;
        }

        .btn-custom {
          font-weight: 600;
          padding: 12px;
          border-radius: 8px;
          transition: all var(--transition-speed);
        }

        .btn-primary-custom {
          background-image: linear-gradient(to right, var(--ui-blue-primary), var(--ui-blue-dark));
          color: var(--ui-white);
          border: none;
        }

        .btn-primary-custom:hover {
          background-image: linear-gradient(to right, var(--ui-blue-dark), var(--ui-blue-primary));
          transform: translateY(-2px);
        }

        .btn-secondary-custom {
          background-color: #6c757d;
          background-image: linear-gradient(to right, #6c757d, #5a6268);
          color: var(--ui-white);
          border: none;
        }

        .btn-secondary-custom:hover {
          background-image: linear-gradient(to right, #5a6268, #6c757d);
          transform: translateY(-2px);
        }
        
        .btn-orange-custom { /* Re-styled as primary blue */
          background-image: linear-gradient(to right, var(--ui-blue-primary), var(--ui-blue-dark));
          color: var(--ui-white);
          border: none;
        }
        
        .btn-orange-custom:hover { /* Re-styled as primary blue hover */
          background-image: linear-gradient(to right, var(--ui-blue-dark), var(--ui-blue-primary));
          transform: translateY(-2px);
        }

        .btn-logout-custom {
            background: transparent;
            border: none;
            color: var(--ui-white);
            font-size: 1.5rem;
            cursor: pointer;
            transition: color 0.3s ease;
        }

        .btn-logout-custom:hover {
            color: var(--ui-blue-primary);
        }

        .camera-preview-container {
          position: relative;
          background-color: #000;
          border-radius: 15px;
          overflow: hidden;
          max-width: 400px;
          margin: 0 auto;
        }

        .camera-preview-container video {
          width: 100%;
          height: auto;
        }

        .spinner-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 10;
        }

        .photo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 1rem;
        }
        
        .photo-item {
            background-color: #f8f9fa;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            border: 1px solid #ddd;
        }
        
        .photo-label {
            font-size: 0.8rem;
            color: var(--ui-dark);
            text-align: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid #eee;
        }
        
        .photo-item img {
            width: 100%;
            height: auto;
            display: block;
        }

        .ad-space {
          border: 2px dashed var(--ui-blue-primary);
          background-color: #f8faff;
          border-radius: 15px;
          text-align: center;
          padding: 40px;
          margin-bottom: 2rem;
        }
        
        .ad-space p {
          color: var(--ui-gray);
          margin: 0;
          font-style: italic;
        }

      `}</style>
      <div className="dashboard-container">
        <header className="app-header">
          <button onClick={logout} className="btn-logout-custom">
            <FaSignOutAlt />
          </button>
          <div className="d-flex align-items-center">
            <FaFingerprint style={{ fontSize: "2rem", marginRight: "0.5rem" }} />
            <h4>AI-HRMS</h4>
          </div>
          <div></div> {/* For proper spacing */}
        </header>

        <motion.div className="greeting-card"
          initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          <h5>{greeting}, {userName}!</h5>
          <p className="small mb-0">Email Id: {userERPId}</p>
        </motion.div>
        
        {/* Ad Space 1: Placed between the greeting and the main panels */}
        <div className="container mt-4">
          <div className="ad-space">
            <p>Advertisement</p>
          </div>
        </div>

        <main className="container my-5 flex-grow-1">
          {message && <Message type={message.type} text={message.text} />}

          <AnimatePresence mode="wait">
            {/* Main Navigation Panel */}
            {!showCheckinCheckoutSelection && !showAttendancePanel && !viewAttendance && (
              <motion.div key="main-panel" className="row justify-content-center"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                <div className="col-md-6 mb-3">
                  <motion.div whileHover={{ scale: 1.05 }} className="card text-center panel-card"
                    onClick={handleShowAttendance} style={{ cursor: "pointer" }}>
                    <div className="card-body">
                      <FaSignInAlt size={48} color="var(--ui-blue-primary)" className="mb-3" />
                      <h5 className="card-title">Attendance Panel</h5>
                      <p className="card-text text-muted">Submit your attendance here.</p>
                      <button className="btn btn-primary-custom w-75">Start</button>
                    </div>
                  </motion.div>
                </div>
                <div className="col-md-6 mb-3">
                  <motion.div whileHover={{ scale: 1.05 }} className="card text-center panel-card"
                    onClick={() => { setViewAttendance(true); }} style={{ cursor: "pointer" }}>
                    <div className="card-body">
                      <FaFileAlt size={48} color="var(--ui-blue-primary)" className="mb-3" />
                      <h5 className="card-title">Attendance Submission</h5>
                      <p className="card-text text-muted">View your attendance history.</p>
                      <button className="btn btn-secondary-custom w-75">View History</button>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Check-in/Check-out Selection Panel */}
            {showCheckinCheckoutSelection && (
              <motion.div key="selection-panel" className="row justify-content-center"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                <div className="col-md-10">
                  <div className="card text-center panel-card">
                    <h4 className="mb-4" style={{ color: "var(--ui-blue-primary)" }}>Choose Your Action</h4>
                    <div className="d-flex justify-content-around mb-3">
                      <motion.button whileHover={{ scale: 1.05 }} className="btn btn-primary-custom btn-lg w-40" onClick={handleCheckinClick}>
                        Check-in 🚀
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} className="btn btn-orange-custom btn-lg w-40" onClick={handleCheckoutClick}>
                        Check-out 👋
                      </motion.button>
                    </div>
                    <button className="btn btn-secondary-custom mt-3" onClick={() => setShowCheckinCheckoutSelection(false)}>
                      Back
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Check-in Form */}
            {showAttendancePanel && isCheckin && (
              <motion.div key="checkin-form" className="row justify-content-center"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                <div className="col-md-10">
                  <div className="card panel-card">
                    <h4 className="mb-4" style={{ color: "var(--ui-blue-primary)" }}>Check-in Details</h4>

                    <div className="mb-3">
                      <label className="form-label-custom">Your Name</label>
                      <input type="text" className="form-control-custom" value={userName} readOnly disabled />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="occupation" className="form-label-custom">Select your occupation</label>
                      <Select
                        id="occupation"
                        options={occupationOptions}
                        value={occupationOptions.find(opt => opt.value === occupation)}
                        onChange={(option) => setOccupation(option ? option.value : "")}
                        isDisabled={fetchingOccupations}
                        isLoading={fetchingOccupations}
                        placeholder={fetchingOccupations ? "Loading..." : "Select occupation"}
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="stateSelect" className="form-label-custom">Select State</label>
                      <Select
                        id="stateSelect"
                        options={stateOptions}
                        value={selectedState}
                        onChange={(option) => { setSelectedState(option); setSelectedOffice(null); setOfficeOptions([]); }}
                        placeholder={fetchingStates ? "Loading..." : "Select a State"}
                        isDisabled={fetchingStates}
                        isLoading={fetchingStates}
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="dccbName" className="form-label-custom">Select Office</label>
                      <Select
                        id="dccbName"
                        options={officeOptions}
                        value={selectedOffice}
                        onChange={setSelectedOffice}
                        placeholder={fetchingOffices ? "Loading..." : "Search or select Office"}
                        isDisabled={!selectedState || fetchingOffices}
                        isLoading={fetchingOffices}
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="bikeMeterReadingCheckin" className="form-label-custom">Bike meter reading (Optional)</label>
                      <input
                        type="number"
                        id="bikeMeterReadingCheckin"
                        className="form-control-custom"
                        value={bikeMeterReadingCheckin}
                        onChange={(e) => setBikeMeterReadingCheckin(e.target.value)}
                        placeholder="e.g., 12345 km"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label-custom">Capture Photos</label>
                      <div className="p-3 border rounded">
                        {currentLabelIndex < requiredPhotosCheckin.length ? (
                          <>
                            <div className="d-flex align-items-center mb-3 p-3">
                              <FaCamera size={40} color="var(--ui-blue-primary)" className="me-3" />
                              <h5 className="mb-0">{requiredPhotosCheckin[currentLabelIndex]}</h5>
                            </div>
                            <div className="camera-preview-container mb-3 position-relative">
                              {loading && (<div className="spinner-overlay d-flex justify-content-center align-items-center">
                                <div className="spinner-border" style={{ color: "var(--ui-blue-primary)" }} role="status"></div>
                              </div>)}
                              <video ref={videoRef} autoPlay playsInline></video>
                              <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
                            </div>
                            <div className="d-flex justify-content-between mb-3">
                              <button className="btn btn-secondary-custom btn-sm" onClick={toggleCameraFacingMode} disabled={loading}>
                                Switch Camera ({cameraFacingMode === "environment" ? "Back" : "Front"})
                              </button>
                              <button className="btn btn-primary-custom" onClick={capturePhoto} disabled={loading}>
                                {loading ? "Capturing..." : "Capture Photo"}
                              </button>
                            </div>
                          </>
                        ) : (<p className="text-success fw-bold"><FaCheckCircle className="me-2" /> All photos captured</p>)}
                        <div className="photo-grid mt-4">
                          {photos.map((p, i) => (
                            <div key={i} className="photo-item card p-2 mb-3">
                              <div className="photo-label">{p.label}</div>
                              <img src={p.data} alt={p.label} className="img-fluid rounded" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mb-3 text-center">
                      <FaMapMarkerAlt className="me-2" color="var(--ui-blue-primary)" /> <strong>Current Location:</strong> {locationName} <br />
                      <small>
                        Lat: {location.lat?.toFixed(5) || "--"} | Lon: {location.lon?.toFixed(5) || "--"}
                      </small>
                      <br />
                      <button className="btn btn-sm btn-link mt-1" onClick={captureLocation}>Refetch Location</button>
                    </div>

                    <button className="btn btn-primary-custom w-100 mt-3" onClick={handleSubmit} disabled={
                      photos.length < requiredPhotosCheckin.length || loading || !occupation || !selectedOffice || !selectedState || INVALID_LOCATIONS.includes(locationName)
                    }>
                      {loading ? "Submitting..." : "Submit Check-in"}
                    </button>
                    <button className="btn btn-secondary-custom w-100 mt-2" onClick={() => { setShowAttendancePanel(false); setShowCheckinCheckoutSelection(true); }} disabled={loading}>Back</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Checkout Processing Panel */}
            {showAttendancePanel && !isCheckin && (
              <motion.div key="checkout-form" className="row justify-content-center"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                <div className="col-md-10">
                  <div className="card panel-card">
                    <h4 className="mb-3" style={{ color: "var(--ui-blue-primary)" }}>Check-out Details</h4>

                    <div className="mb-3 text-center">
                      <FaMapMarkerAlt className="me-2" color="var(--ui-blue-primary)" /> <strong>Current Location:</strong> {locationName} <br />
                      <small>
                        Lat: {location.lat?.toFixed(5) || "--"} | Lon: {location.lon?.toFixed(5) || "--"}
                      </small>
                      <br />
                      <button className="btn btn-sm btn-link mt-1" onClick={captureLocation}>Refetch Location</button>
                    </div>

                    {checkedInAsSEWithMeter && (
                      <div className="mb-3">
                        <label htmlFor="bikeMeterReadingCheckout" className="form-label-custom">Bike meter reading</label>
                        <input type="number" id="bikeMeterReadingCheckout" className="form-control-custom"
                          value={bikeMeterReadingCheckout} onChange={(e) => setBikeMeterReadingCheckout(e.target.value)} required />
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="form-label-custom">Capture Photos</label>
                      <div className="p-3 border rounded">
                        {currentLabelIndex < requiredPhotosCheckout.length ? (
                          <>
                            <div className="d-flex align-items-center mb-3 p-3">
                              <FaCamera size={40} color="var(--ui-blue-primary)" className="me-3" />
                              <h5 className="mb-0">{requiredPhotosCheckout[currentLabelIndex]}</h5>
                            </div>
                            <div className="camera-preview-container mb-3 position-relative">
                              {loading && (<div className="spinner-overlay d-flex justify-content-center align-items-center">
                                <div className="spinner-border" style={{ color: "var(--ui-blue-primary)" }} role="status"></div>
                              </div>)}
                              <video ref={videoRef} autoPlay playsInline></video>
                              <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
                            </div>
                            <div className="d-flex justify-content-between mb-3">
                              <button className="btn btn-secondary-custom btn-sm" onClick={toggleCameraFacingMode} disabled={loading}>
                                Switch Camera ({cameraFacingMode === "environment" ? "Back" : "Front"})
                              </button>
                              <button className="btn btn-orange-custom" onClick={capturePhoto} disabled={loading}>
                                {loading ? "Capturing..." : "Capture Photo"}
                              </button>
                            </div>
                          </>
                        ) : (<p className="text-success fw-bold"><FaCheckCircle className="me-2" /> All photos captured</p>)}
                        <div className="photo-grid mt-4">
                          {photos.map((p, i) => (
                            <div key={i} className="photo-item card p-2 mb-3">
                              <div className="photo-label">{p.label}</div>
                              <img src={p.data} alt={p.label} className="img-fluid rounded" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button className="btn btn-orange-custom w-100 mt-3" onClick={handleCheckoutSubmission} disabled={
                      photos.length < requiredPhotosCheckout.length || loading || INVALID_LOCATIONS.includes(locationName) || (checkedInAsSEWithMeter && !bikeMeterReadingCheckout)
                    }>
                      {loading ? "Submitting..." : "Submit Check-out"}
                    </button>
                    <button className="btn btn-secondary-custom w-100 mt-2" onClick={() => { setShowAttendancePanel(false); setShowCheckinCheckoutSelection(true); }} disabled={loading}>Back</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* View Attendance Panel */}
            {viewAttendance && (
              <motion.div key="history-panel" className="row justify-content-center"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                <div className="col-md-12">
                  <div className="card panel-card">
                    <h4 className="mb-4" style={{ color: "var(--ui-blue-primary)" }}>Attendance Submission History</h4>
                    <SubmissionTable erpId={user?.email || userERPId} />
                      {/* Ad Space 2: Placed within the attendance history view */}
                      <div className="ad-space mt-4">
                        <p>Advertisement</p>
                      </div>
                    <button className="btn btn-secondary-custom w-100 mt-3" onClick={() => setViewAttendance(false)}>Back</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="py-3 text-center text-dark" style={{ backgroundColor: "var(--ui-dashboard-bg)" }}>
          <p className="m-0">&copy; {new Date().getFullYear()} AI-HRMS. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
};

export default MainDashboard;
