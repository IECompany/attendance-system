// frontend/src/components/EmployeeSalaryInformation.jsx - UPDATED for Multi-Tenancy

import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { motion } from 'framer-motion';
import { FaMoneyBillAlt, FaSpinner, FaInfoCircle, FaEdit } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify'; // Assuming you have react-toastify for notifications
import Loader from './Loader'; // Assuming you have a Loader component
import Message from './Message'; // Assuming you have a Message component

import { useAuth } from '../authContext'; // <-- NEW: Import useAuth context

const EmployeeSalaryInformation = () => {
    const { user, token, logout } = useAuth(); // <-- NEW: Get user, token, and logout from AuthContext

    const [employeesSalary, setEmployeesSalary] = useState([]);
    const [loading, setLoading] = useState(false); // For initial data fetch
    const [error, setError] = useState(null);

    // State for month and year selection (defaults to current month/year)
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Current month (1-12)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Current year

    // State for the Edit Salary Details Modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null); // Stores the employee data being edited
    const [isUpdating, setIsUpdating] = useState(false); // For update button loading state

    // Form data for the edit modal
    const [formData, setFormData] = useState({
        salaryInHandPerMonth: '',
        fixedAllowances: '',
        employeePFContribution: '',
        employeeESIContribution: '',
        employerEPFContribution: '',
        employerESICContribution: '',
        otherDeductions: [], // Array of { title, amount }
        reimbursements: [],  // Array of { title, amount }
        manualNetSalaryOverride: '', // Can be null or a number
        salaryDetailsConfigured: false,
        incentive: ''
    });

    // Data for month and year dropdowns
    const months = [
        { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
        { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
        { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
        { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
    ];

    // Generates years from 2 years ago to 2 years in the future
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    // --- NEW: Helper to get authenticated headers ---
    const getAuthHeaders = useCallback(() => {
        if (!token || !user || !user.companyId) {
            // If token or companyId is missing, it means user is not properly authenticated
            // or session is invalid. Redirect to login.
            setError("Session expired or invalid. Please log in again."); // Set error message
            logout(); // Use logout function from context
            return null;
        }
        return {
            'Authorization': `Bearer ${token}`,
            'X-Company-ID': user.companyId
        };
    }, [token, user, logout]); // Dependencies for useCallback

    // Function to fetch employee salary data from the backend
    const fetchEmployeesSalary = async (month, year) => {
        const headers = getAuthHeaders(); // <-- NEW: Get authenticated headers
        if (!headers) {
            setLoading(false);
            return; // Exit if headers are not available
        }

        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.get(`http://localhost:5001/api/admin/employees-salary-info?month=${month}&year=${year}`, {
                headers: headers, // <-- NEW: Pass authentication headers
                withCredentials: true, // Keep this if your backend still expects cookies for some reason, though JWT in header is primary
            });
            setEmployeesSalary(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching employee salary info:", err);
            setError(err.response?.data?.message || err.message || "Failed to fetch salary data.");
            setLoading(false);
        }
    };

    // useEffect to call the fetch function whenever month or year changes
    useEffect(() => {
        // Initial authentication check
        if (!user || !token || !user.companyId) {
            logout();
            return;
        }
        fetchEmployeesSalary(selectedMonth, selectedYear);
    }, [selectedMonth, selectedYear, user, token, logout, getAuthHeaders]); // Added user, token, logout, getAuthHeaders to dependencies

    // Handlers for month/year dropdowns
    const handleMonthChange = (e) => {
        setSelectedMonth(parseInt(e.target.value));
    };

    const handleYearChange = (e) => {
        setSelectedYear(parseInt(e.target.value));
    };

    // Function to open the edit modal and populate form data
    const openEditModal = (employee) => {
        setEditingEmployee(employee);
        // Populate form data with existing employee details for editing
        setFormData({
            salaryInHandPerMonth: employee.salaryInHandPerMonth || '',
            fixedAllowances: employee.fixedAllowances || '',
            employeePFContribution: employee.employeePFContribution || '',
            employeeESIContribution: employee.employeeESIContribution || '',
            employerEPFContribution: employee.employerEPFContribution || '',
            employerESICContribution: employee.employerESICContribution || '',
            otherDeductions: employee.otherDeductions ? [...employee.otherDeductions] : [], // Deep copy array
            reimbursements: employee.reimbursements ? [...employee.reimbursements] : [],   // Deep copy array
            manualNetSalaryOverride: employee.manualNetSalaryOverride === null ? '' : employee.manualNetSalaryOverride,
            salaryDetailsConfigured: employee.salaryDetailsConfigured || false,
            incentive: employee.incentive || ''
        });
        setShowEditModal(true);
    };

    // Function to close the edit modal and reset states
    const closeEditModal = () => {
        setShowEditModal(false);
        setEditingEmployee(null);
        // Reset form data to initial empty states
        setFormData({
            salaryInHandPerMonth: '', fixedAllowances: '', employeePFContribution: '', employeeESIContribution: '',
            employerEPFContribution: '', employerESICContribution: '', otherDeductions: [], reimbursements: [],
            manualNetSalaryOverride: '', salaryDetailsConfigured: false, incentive: ''
        });
    };

    // Universal handler for form input changes (single values)
    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            // Convert to number if type is number, or keep as string/boolean
            [name]: type === 'checkbox' ? checked : (value === '' ? '' : (type === 'number' ? parseFloat(value) : value))
        }));
    };

    // Handler for changes within dynamic arrays (deductions/reimbursements)
    const handleArrayChange = (type, index, field, value) => {
        setFormData(prev => {
            const newArray = [...prev[type]];
            newArray[index] = { ...newArray[index], [field]: value };
            return { ...prev, [type]: newArray };
        });
    };

    // Add new item to dynamic array
    const addArrayItem = (type) => {
        setFormData(prev => ({
            ...prev,
            [type]: [...prev[type], { title: '', amount: 0 }] // New item structure
        }));
    };

    // Remove item from dynamic array
    const removeArrayItem = (type, index) => {
        setFormData(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    // Handler for submitting salary detail updates
    const handleUpdateSalaryDetails = async (e) => {
        e.preventDefault();
        setIsUpdating(true); // Set loading for update button

        const headers = getAuthHeaders(); // <-- NEW: Get authenticated headers
        if (!headers) {
            setIsUpdating(false);
            return; // Exit if headers are not available
        }

        try {
            // Prepare data for sending: ensure numbers are numbers, empty strings for override become null
            const dataToSend = {
                ...formData,
                salaryInHandPerMonth: formData.salaryInHandPerMonth === '' ? 0 : parseFloat(formData.salaryInHandPerMonth),
                fixedAllowances: formData.fixedAllowances === '' ? 0 : parseFloat(formData.fixedAllowances),
                employeePFContribution: formData.employeePFContribution === '' ? 0 : parseFloat(formData.employeePFContribution),
                employeeESIContribution: formData.employeeESIContribution === '' ? 0 : parseFloat(formData.employeeESIContribution),
                employerEPFContribution: formData.employerEPFContribution === '' ? 0 : parseFloat(formData.employerEPFContribution),
                employerESICContribution: formData.employerESICContribution === '' ? 0 : parseFloat(formData.employerESICContribution),
                incentive: formData.incentive === '' ? 0 : parseFloat(formData.incentive),
                manualNetSalaryOverride: formData.manualNetSalaryOverride === '' ? null : parseFloat(formData.manualNetSalaryOverride),
                // Ensure amount fields in arrays are numbers
                otherDeductions: formData.otherDeductions.map(item => ({ ...item, amount: parseFloat(item.amount) || 0 })),
                reimbursements: formData.reimbursements.map(item => ({ ...item, amount: parseFloat(item.amount) || 0 })),
            };

            await axios.put(`http://localhost:5001/api/admin/employees-salary-info/${editingEmployee._id}`, dataToSend, {
                headers: headers, // <-- NEW: Pass authentication headers
                withCredentials: true,
            });
            toast.success('Salary details updated successfully!');
            closeEditModal();
            fetchEmployeesSalary(selectedMonth, selectedYear); // Refresh data after update
        } catch (err) {
            console.error("Error updating salary details:", err.response?.data?.message || err.message);
            toast.error(err.response?.data?.message || err.message || "Failed to update salary details.");
        } finally {
            setIsUpdating(false); // Reset loading state
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="card shadow-sm panel-card h-100 d-flex flex-column"
            style={{ backgroundColor: "#e7f0ff" }}
        >
            <div className="card-header bg-success text-white fw-bold d-flex justify-content-between align-items-center">
                <span><FaMoneyBillAlt className="me-2" /> Employee Salary Information</span>
                {/* Month and Year Selectors */}
                <div className="d-flex align-items-center">
                    <label htmlFor="monthSelect" className="me-2 mb-0">Month:</label>
                    <select id="monthSelect" className="form-select form-select-sm me-3" value={selectedMonth} onChange={handleMonthChange}>
                        {months.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                    <label htmlFor="yearSelect" className="me-2 mb-0">Year:</label>
                    <select id="yearSelect" className="form-select form-select-sm" value={selectedYear} onChange={handleYearChange}>
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="card-body d-flex flex-column">
                {loading ? (
                    <Loader />
                ) : error ? (
                    <Message variant="danger">{error}</Message>
                ) : employeesSalary.length === 0 ? (
                    <Message variant="info">
                        <FaInfoCircle className="me-2" /> No salary data found for the selected month/year.
                        This might be because no employees exist with the 'user' or 'pacs' userType,
                        or they lack completed check-in/out records for this period, or their base salary is 0.
                    </Message>
                ) : (
                    <div className="table-responsive flex-grow-1">
                        <table className="table table-striped table-hover table-bordered table-sm align-middle">
                            <thead className="table-dark">
                                <tr>
                                    <th>#</th>
                                    <th>Employee ID</th>
                                    <th>Name</th>
                                    <th>Office / District</th>
                                    <th>Monthly Base (In Hand)</th>
                                    <th>Paid Days</th>
                                    <th>Adjusted Salary</th>
                                    <th>Fixed Allowances</th>
                                    <th>Incentive</th>
                                    <th>Gross Salary</th>
                                    <th>Emp. PF/ESI Deductions</th>
                                    <th>Other Deductions</th>
                                    <th>Reimbursements</th>
                                    <th>Net Salary</th>
                                    <th>CTC (Calculated)</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employeesSalary.map((employee, index) => (
                                    <tr key={employee._id}>
                                        <td>{index + 1}</td>
                                        <td>{employee.pacsId}</td>
                                        <td>{employee.name}</td>
                                        <td>{employee.pacsName} {employee.district ? `(${employee.district})` : ''}</td>
                                        <td>₹{employee.salaryInHandPerMonth.toFixed(2)}</td>
                                        <td>{employee.calculated.paidDays.toFixed(1)}</td>
                                        <td>₹{employee.calculated.attendanceAdjustedSalary.toFixed(2)}</td>
                                        <td>₹{employee.fixedAllowances.toFixed(2)}</td>
                                        <td>₹{employee.incentive.toFixed(2)}</td>
                                        <td>₹{employee.calculated.grossSalary.toFixed(2)}</td>
                                        <td>
                                            PF: ₹{employee.calculated.calculatedEmployeeEPF.toFixed(2)} <br/>
                                            ESI: ₹{employee.calculated.calculatedEmployeeESIC.toFixed(2)}
                                        </td>
                                        <td>
                                            {employee.otherDeductions.length > 0 ? (
                                                <ul className="list-unstyled mb-0 small">
                                                    {employee.otherDeductions.map((ded, i) => (
                                                        <li key={i}>{ded.title}: ₹{ded.amount.toFixed(2)}</li>
                                                    ))}
                                                    <li className="fw-bold">Total: ₹{employee.calculated.totalCustomDeductions.toFixed(2)}</li>
                                                </ul>
                                            ) : 'N/A'}
                                        </td>
                                        <td>
                                            {employee.reimbursements.length > 0 ? (
                                                <ul className="list-unstyled mb-0 small">
                                                    {employee.reimbursements.map((reim, i) => (
                                                        <li key={i}>{reim.title}: ₹{reim.amount.toFixed(2)}</li>
                                                    ))}
                                                    <li className="fw-bold">Total: ₹{employee.calculated.totalReimbursements.toFixed(2)}</li>
                                                </ul>
                                            ) : 'N/A'}
                                        </td>
                                        <td className={employee.manualNetSalaryOverride !== null ? 'fw-bold text-primary' : ''}>
                                            ₹{employee.calculated.netSalary.toFixed(2)}
                                            {employee.manualNetSalaryOverride !== null && (
                                                <div className="text-muted small">
                                                    (Override: ₹{employee.manualNetSalaryOverride.toFixed(2)})
                                                </div>
                                            )}
                                        </td>
                                        <td>₹{employee.calculated.calculatedCtc.toFixed(2)}</td>
                                        <td>
                                            <button className="btn btn-sm btn-info" onClick={() => openEditModal(employee)}>
                                                <FaEdit /> Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Salary Modal */}
            {showEditModal && editingEmployee && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-lg" role="document">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">Edit Salary Details for {editingEmployee.name} ({editingEmployee.pacsId})</h5>
                                <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={closeEditModal}></button>
                            </div>
                            <form onSubmit={handleUpdateSalaryDetails}>
                                <div className="modal-body">
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label htmlFor="salaryInHandPerMonth" className="form-label">Base Salary (In Hand Per Month)</label>
                                            <input type="number" step="0.01" className="form-control" id="salaryInHandPerMonth" name="salaryInHandPerMonth" value={formData.salaryInHandPerMonth} onChange={handleFormChange} />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="fixedAllowances" className="form-label">Fixed Allowances</label>
                                            <input type="number" step="0.01" className="form-control" id="fixedAllowances" name="fixedAllowances" value={formData.fixedAllowances} onChange={handleFormChange} />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label htmlFor="employeePFContribution" className="form-label">Employee PF Contribution</label>
                                            <input type="number" step="0.01" className="form-control" id="employeePFContribution" name="employeePFContribution" value={formData.employeePFContribution} onChange={handleFormChange} />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="employeeESIContribution" className="form-label">Employee ESI Contribution</label>
                                            <input type="number" step="0.01" className="form-control" id="employeeESIContribution" name="employeeESIContribution" value={formData.employeeESIContribution} onChange={handleFormChange} />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label htmlFor="employerEPFContribution" className="form-label">Employer EPF Contribution</label>
                                            <input type="number" step="0.01" className="form-control" id="employerEPFContribution" name="employerEPFContribution" value={formData.employerEPFContribution} onChange={handleFormChange} />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="employerESICContribution" className="form-label">Employer ESIC Contribution</label>
                                            <input type="number" step="0.01" className="form-control" id="employerESICContribution" name="employerESICContribution" value={formData.employerESICContribution} onChange={handleFormChange} />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label htmlFor="incentive" className="form-label">Incentive</label>
                                            <input type="number" step="0.01" className="form-control" id="incentive" name="incentive" value={formData.incentive} onChange={handleFormChange} />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="manualNetSalaryOverride" className="form-label">Manual Net Salary Override (Leave blank for auto-calc)</label>
                                            <input type="number" step="0.01" className="form-control" id="manualNetSalaryOverride" name="manualNetSalaryOverride" value={formData.manualNetSalaryOverride} onChange={handleFormChange} placeholder="Enter to override" />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <div className="form-check">
                                            <input className="form-check-input" type="checkbox" id="salaryDetailsConfigured" name="salaryDetailsConfigured" checked={formData.salaryDetailsConfigured} onChange={handleFormChange} />
                                            <label className="form-check-label" htmlFor="salaryDetailsConfigured">
                                                Salary Details Configured
                                            </label>
                                        </div>
                                    </div>

                                    {/* Other Deductions */}
                                    <div className="mb-3 border p-3 rounded bg-light">
                                        <h6 className="d-flex justify-content-between align-items-center">
                                            Other Deductions
                                            <button type="button" className="btn btn-sm btn-primary" onClick={() => addArrayItem('otherDeductions')}>+ Add Deduction</button>
                                        </h6>
                                        {formData.otherDeductions.map((ded, index) => (
                                            <div key={index} className="row mb-2 align-items-center bg-white p-2 rounded shadow-sm">
                                                <div className="col-5">
                                                    <input type="text" className="form-control form-control-sm" placeholder="Title (e.g., Loan)" value={ded.title} onChange={(e) => handleArrayChange('otherDeductions', index, 'title', e.target.value)} />
                                                </div>
                                                <div className="col-5">
                                                    <input type="number" step="0.01" className="form-control form-control-sm" placeholder="Amount" value={ded.amount} onChange={(e) => handleArrayChange('otherDeductions', index, 'amount', e.target.value)} />
                                                </div>
                                                <div className="col-2 text-end">
                                                    <button type="button" className="btn btn-sm btn-danger" onClick={() => removeArrayItem('otherDeductions', index)}>&times;</button>
                                                </div>
                                            </div>
                                        ))}
                                        {formData.otherDeductions.length === 0 && <p className="text-muted small">No custom deductions added.</p>}
                                    </div>

                                    {/* Reimbursements */}
                                    <div className="mb-3 border p-3 rounded bg-light">
                                        <h6 className="d-flex justify-content-between align-items-center">
                                            Reimbursements
                                            <button type="button" className="btn btn-sm btn-primary" onClick={() => addArrayItem('reimbursements')}>+ Add Reimbursement</button>
                                        </h6>
                                        {formData.reimbursements.map((reim, index) => (
                                            <div key={index} className="row mb-2 align-items-center bg-white p-2 rounded shadow-sm">
                                                <div className="col-5">
                                                    <input type="text" className="form-control form-control-sm" placeholder="Title (e.g., Travel Claim)" value={reim.title} onChange={(e) => handleArrayChange('reimbursements', index, 'title', e.target.value)} />
                                                </div>
                                                <div className="col-5">
                                                    <input type="number" step="0.01" className="form-control form-control-sm" placeholder="Amount" value={reim.amount} onChange={(e) => handleArrayChange('reimbursements', index, 'amount', e.target.value)} />
                                                </div>
                                                <div className="col-2 text-end">
                                                    <button type="button" className="btn btn-sm btn-danger" onClick={() => removeArrayItem('reimbursements', index)}>&times;</button>
                                                </div>
                                            </div>
                                        ))}
                                        {formData.reimbursements.length === 0 && <p className="text-muted small">No reimbursements added.</p>}
                                    </div>

                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeEditModal}>Close</button>
                                    <button type="submit" className="btn btn-primary" disabled={isUpdating}>
                                        {isUpdating ? <FaSpinner className="spinner-border spinner-border-sm me-2" /> : ''} Update Details
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default EmployeeSalaryInformation;
