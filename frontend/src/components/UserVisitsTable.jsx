import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Modal, Image, Spinner, Alert, Table } from 'react-bootstrap';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// We add a default value of an empty array [] for userVisits
const UserVisitsTable = ({ userVisits = [], loading, error, userOccupation }) => {
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedVisitPhotos, setSelectedVisitPhotos] = useState([]);
  const [selectedVisitId, setSelectedVisitId] = useState("");

  const isServiceEngineer = userOccupation === 'SE';

  const handleShowPhotoModal = (visit) => {
    const photos = [];

    // Add Check-in Photos
    if (visit.checkin && visit.checkin.photos && visit.checkin.photos.length > 0) {
      visit.checkin.photos.forEach((photo) => {
        photos.push({
          url: photo.url,
          label: photo.label || `Check-in Photo`,
          type: 'checkin'
        });
      });
    }

    // Add Checkout Photos (if exists and is an array)
    if (visit.checkout && visit.checkout.photos && Array.isArray(visit.checkout.photos) && visit.checkout.photos.length > 0) {
      visit.checkout.photos.forEach((photo) => {
        photos.push({
          url: photo.url,
          label: photo.label || `Checkout Photo`,
          type: 'checkout'
        });
      });
    }

    setSelectedVisitPhotos(photos);
    setSelectedVisitId(visit._id); // Using _id for user panel is fine
    setShowPhotoModal(true);
  };

  const handleClosePhotoModal = () => {
    setShowPhotoModal(false);
    setSelectedVisitPhotos([]);
    setSelectedVisitId("");
  };

  const formatDateTime = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      console.error('Error formatting date:', e, 'for string:', dateString);
      return 'Error Formatting Date';
    }
  };

  const downloadSinglePhoto = async (photoUrl, filename) => {
    try {
      const response = await fetch(photoUrl);
      if (!response.ok) throw new Error(`Failed to download photo: ${response.statusText}`);
      const blob = await response.blob();
      saveAs(blob, filename);
    } catch (err) {
      console.error("Error downloading single photo:", err);
      alert(`Failed to download ${filename}. Please try again.`);
    }
  };

  const downloadAllPhotosAsZip = async () => {
    if (selectedVisitPhotos.length === 0) {
      alert("No photos to download for this visit.");
      return;
    }

    const zip = new JSZip();
    const folderName = `visit_${selectedVisitId || 'photos'}`;
    const folder = zip.folder(folderName);

    const downloadPromises = selectedVisitPhotos.map(async (photo) => {
      try {
        const response = await fetch(photo.url);
        if (!response.ok) {
          console.warn(`Could not fetch photo ${photo.label} from ${photo.url}: ${response.statusText}`);
          return null;
        }
        const blob = await response.blob();
        const filename = `${photo.type}_${photo.label.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.]/g, '')}.jpg`;
        folder.file(filename, blob);
        return true;
      } catch (error) {
        console.error(`Error adding photo ${photo.label} to zip:`, error);
        return null;
      }
    });

    await Promise.all(downloadPromises);

    try {
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${folderName}.zip`);
    } catch (zipErr) {
      console.error("Error generating zip file:", zipErr);
      alert("Failed to create and download ZIP file. Please try downloading photos individually.");
    }
  };

  return (
    <div className="user-visits-table-container">
      {loading && (
        <div className="text-center my-4">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading your visits...</span>
          </Spinner>
          <p className="mt-2 text-primary">Loading your attendance data...</p>
        </div>
      )}

      {error && <Alert variant="danger" className="my-4">{error}</Alert>}

      {/* This check now safely uses .length because userVisits is guaranteed to be an array */}
      {!loading && !error && userVisits.length === 0 && (
        <Alert variant="info" className="my-4">You have not submitted any visits yet.</Alert>
      )}

      {/* This check also safely uses .length */}
      {!loading && !error && userVisits.length > 0 && (
        <div className="table-responsive">
          <Table striped bordered hover responsive className="mt-4 shadow-sm rounded">
            <thead className="table-dark">
              <tr>
                <th>Status</th>
                <th>Check-in Time</th>
                <th>Check-in Location</th>
                {isServiceEngineer && <th>Check-in Meter (Km)</th>}
                <th>Checkout Time</th>
                <th>Checkout Location</th>
                {isServiceEngineer && <th>Checkout Meter (Km)</th>}
                {isServiceEngineer && <th>KM Run Today</th>}
                <th>Photos</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {/* .map is now safe because userVisits is guaranteed to be an array */}
                {userVisits.map((visit) => {
                  const checkinMeter = parseFloat(visit.checkin?.bikeMeterReading);
                  const checkoutMeter = parseFloat(visit.checkout?.bikeMeterReading);
                  const kmRunToday =
                    visit.status === 'completed' &&
                    isServiceEngineer &&
                    !isNaN(checkinMeter) &&
                    !isNaN(checkoutMeter)
                      ? (checkoutMeter - checkinMeter).toFixed(2)
                      : 'N/A';

                  const totalPhotos =
                    (visit.checkin?.photos?.length || 0) +
                    (visit.checkout?.photos?.length || 0);

                  return (
                    <motion.tr
                      key={visit._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td>
                        <span className={`badge ${visit.status === 'active' ? 'bg-info' : 'bg-success'}`}>
                          {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                        </span>
                      </td>
                      <td>{formatDateTime(visit.checkin?.date)}</td>
                      <td>{visit.checkin?.locationName}</td>
                      {isServiceEngineer && (
                        <td>
                          {visit.checkin?.bikeMeterReading
                            ? `${visit.checkin.bikeMeterReading} km`
                            : 'N/A'}
                        </td>
                      )}
                      <td>
                        {visit.checkout && visit.checkout.date
                          ? formatDateTime(visit.checkout.date)
                          : <span className="text-muted">Ongoing</span>}
                      </td>
                      <td>
                        {visit.checkout && visit.checkout.locationName
                          ? visit.checkout.locationName
                          : <span className="text-muted">N/A</span>}
                      </td>
                      {isServiceEngineer && (
                        <td>
                          {visit.checkout?.bikeMeterReading
                            ? `${visit.checkout.bikeMeterReading} km`
                            : 'N/A'}
                        </td>
                      )}
                      {isServiceEngineer && (
                        <td>{kmRunToday}</td>
                      )}
                      <td>
                        {totalPhotos > 0 ? (
                          <Button
                            variant="info"
                            size="sm"
                            onClick={() => handleShowPhotoModal(visit)}
                          >
                            Photos ({totalPhotos})
                          </Button>
                        ) : 'No Photos'}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </Table>
        </div>
      )}
      <Modal show={showPhotoModal} onHide={handleClosePhotoModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Photos for Visit ID: {selectedVisitId}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVisitPhotos.length > 0 ? (
            <div className="row g-3">
              {selectedVisitPhotos.map((photo, index) => (
                <div key={index} className="col-sm-6 col-md-4 d-flex">
                  <div className="card w-100 shadow-sm">
                    <a href={photo.url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                      <Image src={photo.url} alt={photo.label} className="card-img-top" fluid style={{ maxHeight: '200px', objectFit: 'cover' }} />
                    </a>
                    <div className="card-body d-flex flex-column">
                      <h6 className="card-title text-center">{photo.label}</h6>
                      <div className="d-flex justify-content-between mt-auto">
                        <a
                          href={photo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-secondary w-50 me-1"
                        >
                          View
                        </a>
                        <Button
                          variant="success"
                          size="sm"
                          className="w-50 ms-1"
                          onClick={() => downloadSinglePhoto(photo.url, `visit_${selectedVisitId}_${photo.label.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.]/g, '')}.jpg`)}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted">No photos available for this visit.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selectedVisitPhotos.length > 0 && (
            <Button variant="primary" onClick={downloadAllPhotosAsZip}>
              Download All Photos as .ZIP
            </Button>
          )}
          <Button variant="secondary" onClick={handleClosePhotoModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .user-visits-table-container {
          background-color: #ffffff;
          padding: 20px;
          border-radius: 1rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .table thead th {
          background-color: #0d47a1;
          color: white;
          white-space: nowrap;
        }
        .table tbody td {
            vertical-align: middle;
            white-space: nowrap; /* Keep this for compactness */
        }
        .table-responsive {
            overflow-x: auto;
        }
        /* Photo Modal specific styles can be shared or defined here */
        .photo-modal-content .card-img-top {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }
        .photo-modal-content .card {
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        .photo-modal-content .card-body {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        .table > :not(caption)>*>* {
            padding: 0.5rem 0.75rem;
        }
      `}</style>
    </div>
  );
};

export default UserVisitsTable;