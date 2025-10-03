import React, { useState, useMemo, useCallback } from 'react';
import { FaEye, FaFilter, FaRedo, FaAngleUp, FaAngleDown } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Modal, Image, Spinner, Alert, Table, Collapse, Nav, Tab, Form, Row, Col } from 'react-bootstrap';
// JSZip is expected to be loaded from a CDN via a script tag in your index.html
// <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
import { saveAs } from 'file-saver';
import { useAuth } from '../authContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

const AdminVisitsTable = ({ visits, loading, error }) => {
  const { user, token, logout } = useAuth();
  const JSZip = window.JSZip; // Access JSZip from the window object

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedVisitPhotos, setSelectedVisitPhotos] = useState([]);
  const [selectedVisitErpId, setSelectedVisitErpId] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [activeTab, setActiveTab] = useState('normal');

  // --- Filter States ---
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedDCCB, setSelectedDCCB] = useState('All Offices');
  const [selectedOccupation, setSelectedOccupation] = useState('All Occupations');

  // --- Helper to get authenticated headers ---
  const getAuthHeaders = useCallback(() => {
    if (!token || !user || !user.companyId) {
      alert("Session expired or invalid. Please log in again.");
      logout();
      return null;
    }
    return {
      'Authorization': `Bearer ${token}`,
      'X-Company-ID': user.companyId
    };
  }, [token, user, logout]);

  // Memoize normal and SE visits
  const { normalVisits, seVisits } = useMemo(() => {
    const normal = [];
    const se = [];
    visits.forEach(visit => {
      if (visit.checkin?.occupation === "SE") {
        se.push(visit);
      } else {
        normal.push(visit);
      }
    });
    return { normalVisits: normal, seVisits: se };
  }, [visits]);

  // --- Derive Unique Filter Options from `visits` data ---
  const availableStates = useMemo(() => {
    const states = new Set();
    visits.forEach(visit => {
      if (visit.checkin?.state) {
        states.add(visit.checkin.state);
      }
    });
    return ['All States', ...Array.from(states).sort()];
  }, [visits]);

  const availableDCCBs = useMemo(() => {
    const dccbs = new Set();
    visits.forEach(visit => {
      if (visit.checkin?.dccb) {
        dccbs.add(visit.checkin.dccb);
      }
    });
    return ['All Offices', ...Array.from(dccbs).sort()];
  }, [visits]);

  const availableOccupations = useMemo(() => {
    const occupations = new Set();
    visits.forEach(visit => {
      if (visit.checkin?.occupation) {
        occupations.add(visit.checkin.occupation);
      }
    });
    return ['All Occupations', ...Array.from(occupations).sort()];
  }, [visits]);

  // --- Apply Filters to Visits ---
  const applyFilters = (visitsToFilter) => {
    return visitsToFilter.filter(visit => {
      const matchesState = selectedState === 'All States' || visit.checkin?.state === selectedState;
      const matchesDCCB = selectedDCCB === 'All Offices' || visit.checkin?.dccb === selectedDCCB;
      const matchesOccupation = selectedOccupation === 'All Occupations' || visit.checkin?.occupation === selectedOccupation;
      return matchesState && matchesDCCB && matchesOccupation;
    });
  };

  const filteredNormalVisits = useMemo(() => {
    return applyFilters(normalVisits);
  }, [normalVisits, selectedState, selectedDCCB, selectedOccupation]);

  const filteredSeVisits = useMemo(() => {
    return applyFilters(seVisits);
  }, [seVisits, selectedState, selectedDCCB, selectedOccupation]);

  // --- Reset Filters ---
  const handleResetFilters = () => {
    setSelectedState('All States');
    setSelectedDCCB('All Offices');
    setSelectedOccupation('All Occupations');
  };

  const handleShowPhotoModal = (visit) => {
    const photos = [];
    if (visit.checkin && visit.checkin.photos && visit.checkin.photos.length > 0) {
      visit.checkin.photos.forEach((photo) => {
        photos.push({
          url: photo.url,
          label: photo.label || `Check-in Photo`,
          type: 'checkin'
        });
      });
    }
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
    setSelectedVisitErpId(visit.erpId);
    setShowPhotoModal(true);
  };

  const handleClosePhotoModal = () => {
    setShowPhotoModal(false);
    setSelectedVisitPhotos([]);
    setSelectedVisitErpId("");
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
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await fetch(`${API_BASE_URL}/download-image?url=${encodeURIComponent(photoUrl)}`, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) throw new Error(`Failed to download photo: ${response.statusText}`);
      const blob = await response.blob();
      saveAs(blob, filename);
    } catch (err) {
      console.error("Error downloading single photo:", err);
      alert(`Failed to download ${filename}. Please try again.`);
    }
  };

  const downloadAllPhotosAsZip = async () => {
    if (!JSZip) {
        alert("Could not find JSZip library. Please ensure it's loaded correctly.");
        return;
    }
    if (selectedVisitPhotos.length === 0) {
      alert("No photos to download for this visit.");
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) return;

    const zip = new JSZip();
    const folderName = `${selectedVisitErpId || 'visit'}_all_photos`;
    const folder = zip.folder(folderName);

    const downloadPromises = selectedVisitPhotos.map(async (photo) => {
      try {
        const response = await fetch(`${API_BASE_URL}/download-image?url=${encodeURIComponent(photo.url)}`, {
          method: 'GET',
          headers: headers
        });
        
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

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // --- Reusable Table Component for DRY (Don't Repeat Yourself) Principle ---
  const renderVisitTable = (visitsToRender, isSETable) => (
    <div className="table-responsive">
      <Table striped bordered hover responsive className="mt-4 shadow-sm rounded">
        <thead className="table-dark">
          <tr>
            <th>Email ID</th>
            <th>Status</th>
            <th>Photos</th>
            <th>Occupation</th>
            <th>Check-in Time</th>
            <th>Checkout Time</th>
            {isSETable && <th>Check-in Meter (Km)</th>}
            {isSETable && <th>Checkout Meter (Km)</th>}
            {isSETable && <th>KM Run Today</th>}
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {visitsToRender.length > 0 ? (
              visitsToRender.map((visit) => {
                const checkinMeter = parseFloat(visit.checkin?.bikeMeterReading);
                const checkoutMeter = parseFloat(visit.checkout?.bikeMeterReading);
                const kmRunToday =
                  visit.status === 'completed' &&
                  isSETable &&
                  !isNaN(checkinMeter) &&
                  !isNaN(checkoutMeter)
                    ? (checkoutMeter - checkinMeter).toFixed(2)
                    : 'N/A';

                const totalPhotos =
                  (visit.checkin?.photos?.length || 0) +
                  (visit.checkout?.photos?.length || 0);

                const isExpanded = expandedRows[visit._id];

                return (
                  <React.Fragment key={visit._id}>
                    <motion.tr
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td>{visit.erpId}</td>
                      <td>
                        <span className={`badge ${visit.status === 'active' ? 'bg-info' : 'bg-success'}`}>
                          {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                        </span>
                      </td>
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
                      <td>{visit.checkin?.occupation || 'N/A'}</td>
                      <td>{formatDateTime(visit.checkin?.date)}</td>
                      <td>
                        {visit.checkout && visit.checkout.date
                          ? formatDateTime(visit.checkout.date)
                          : <span className="text-muted">Ongoing</span>}
                      </td>
                      {isSETable && (
                        <>
                          <td>
                            {visit.checkin?.occupation === "SE" && visit.checkin?.bikeMeterReading
                              ? `${visit.checkin.bikeMeterReading} km`
                              : 'N/A'}
                          </td>
                          <td>
                            {visit.checkin?.occupation === "SE" && visit.checkout?.bikeMeterReading
                              ? `${visit.checkout.bikeMeterReading} km`
                              : 'N/A'}
                          </td>
                          <td>{kmRunToday}</td>
                        </>
                      )}
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => toggleRow(visit._id)}
                          aria-controls={`collapse-details-${visit._id}`}
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? <FaAngleUp /> : <FaAngleDown />}
                        </Button>
                      </td>
                    </motion.tr>
                    {/* Collapsible Row for Details */}
                    <tr>
                      <td colSpan={isSETable ? "10" : "7"} className="p-0 border-0">
                        <Collapse in={isExpanded}>
                          <div id={`collapse-details-${visit._id}`}>
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              className="expanded-row-details p-3 bg-light border-top"
                            >
                              <div className="row g-2">
                                <div className="col-md-6">
                                  <strong>Check-in Details:</strong><br />
                                  Location: {visit.checkin?.locationName || 'N/A'}<br />
                                  Lat/Long: {visit.checkin?.latitude?.toFixed(5) || 'N/A'}, {visit.checkin?.longitude?.toFixed(5) || 'N/A'}<br />
                                  State: {visit.checkin?.state || 'N/A'}<br />
                                  DCCB: {visit.checkin?.dccb || 'N/A'}
                                </div>
                                <div className="col-md-6">
                                  <strong>Checkout Details:</strong><br />
                                  Location: {visit.checkout?.locationName || 'N/A'}<br />
                                  Lat/Long: {visit.checkout?.latitude?.toFixed(5) || 'N/A'}, {visit.checkout?.longitude?.toFixed(5) || 'N/A'}
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        </Collapse>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={isSETable ? "10" : "7"} className="text-center py-4">
                  No visits found for the selected filters.
                </td>
              </tr>
            )}
          </AnimatePresence>
        </tbody>
      </Table>
    </div>
  );

  return (
    <div className="admin-visits-table-container">
      {loading && (
        <div className="text-center my-4">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading all visits...</span>
          </Spinner>
          <p className="mt-2" style={{ color: 'var(--ui-blue-primary)' }}>Loading all visit data for admin panel...</p>
        </div>
      )}

      {error && <Alert variant="danger" className="my-4">{error}</Alert>}

      {!loading && !error && visits.length === 0 && (
        <Alert variant="info" className="my-4">No visit data found based on current filters.</Alert>
      )}

      {!loading && !error && visits.length > 0 && (
        <>
          {/* --- Filter Section --- */}
          <div className="filter-section p-3 mb-4 rounded shadow-sm">
            <h5 className="mb-3" style={{ color: 'var(--ui-blue-primary)' }}><FaFilter className="me-2" />Apply Filters</h5>
            <Row className="g-3 align-items-end">
              <Col md={4} sm={6}>
                <Form.Group controlId="filterByState">
                  <Form.Label>Search By State:</Form.Label>
                  <Form.Select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                  >
                    {availableStates.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4} sm={6}>
                <Form.Group controlId="filterByOffice">
                  <Form.Label>Search By Office</Form.Label>
                  <Form.Select
                    value={selectedDCCB}
                    onChange={(e) => setSelectedDCCB(e.target.value)}
                  >
                    {availableDCCBs.map((dccb) => (
                      <option key={dccb} value={dccb}>{dccb}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4} sm={12}>
                <Form.Group controlId="filterByOccupation">
                  <Form.Label>Search By Occupation:</Form.Label>
                  <Form.Select
                    value={selectedOccupation}
                    onChange={(e) => setSelectedOccupation(e.target.value)}
                  >
                    {availableOccupations.map((occupation) => (
                      <option key={occupation} value={occupation}>{occupation}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} className="d-flex justify-content-end">
                <Button variant="outline-secondary" onClick={handleResetFilters} size="sm">
                  <FaRedo className="me-1" /> Reset Filters
                </Button>
              </Col>
            </Row>
          </div>
          {/* --- End Filter Section --- */}

          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link eventKey="normal">Employee Attendance ({filteredNormalVisits.length})</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                {/*<Nav.Link eventKey="se">SE Attendance ({filteredSeVisits.length})</Nav.Link>*/}
              </Nav.Item>
            </Nav>
            <Tab.Content>
              <Tab.Pane eventKey="normal">
                {filteredNormalVisits.length > 0 ? (
                  renderVisitTable(filteredNormalVisits, false)
                ) : (
                  <Alert variant="info" className="my-4">No normal user visits found for the selected filters.</Alert>
                )}
              </Tab.Pane>
              <Tab.Pane eventKey="se">
                {filteredSeVisits.length > 0 ? (
                  renderVisitTable(filteredSeVisits, true)
                ) : (
                  <Alert variant="info" className="my-4">No Service Engineer visits found for the selected filters.</Alert>
                )}
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </>
      )}

      {/* Photo Display Modal */}
      <Modal show={showPhotoModal} onHide={handleClosePhotoModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>All Photos for Email Id: {selectedVisitErpId}</Modal.Title>
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
                          onClick={() => downloadSinglePhoto(photo.url, `${selectedVisitErpId}_${photo.label.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.]/g, '')}.jpg`)}
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
        :root {
            --ui-blue-primary: #2962FF;
            --ui-blue-dark: #0D47A1;
        }
        .admin-visits-table-container {
          background-color: #ffffff;
          padding: 20px;
          border-radius: 1rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .table thead th {
          background-color: var(--ui-blue-dark);
          color: white;
          white-space: nowrap;
        }
        .table tbody td {
            vertical-align: middle;
        }
        .table-responsive {
            overflow-x: auto;
        }
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
        .expanded-row-details {
            border-radius: 0.5rem;
            margin-top: 5px;
        }
        .expanded-row-details strong {
            color: var(--ui-blue-dark);
        }
        .table > :not(caption)>*>* {
            padding: 0.5rem 0.75rem;
        }
        .nav-tabs .nav-link.active {
            background-color: var(--ui-blue-dark);
            color: white;
            border-color: var(--ui-blue-dark);
        }
        .nav-tabs .nav-link {
            color: var(--ui-blue-dark);
            border: 1px solid transparent;
            border-top-left-radius: 0.25rem;
            border-top-right-radius: 0.25rem;
        }
        .nav-tabs .nav-link:hover {
            border-color: #e9ecef #e9ecef #dee2e6;
        }
        .filter-section {
          padding: 1.5rem;
          border-radius: 0.75rem;
          background-color: #f8f9fa;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          border: 1px solid #e0e0e0;
        }
      `}</style>
    </div>
  );
};

export default AdminVisitsTable;

