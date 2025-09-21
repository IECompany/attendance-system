import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaMoneyBillAlt, FaSpinner, FaInfoCircle, FaEdit, FaFilePdf, FaSearch, FaCalendarAlt } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import Loader from './Loader';
import Message from './Message';
import { useAuth } from '../authContext';
import { useReactToPrint } from 'react-to-print';
import SalarySlipTemplate from './SalarySlipTemplate';
import { Modal, Button, Form, InputNumber } from 'antd';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/admin'|| "http://localhost:5001/api/admin";

const EmployeeSalaryInformation = () => {
    const { user, token, logout } = useAuth();

    const [employeesSalary, setEmployeesSalary] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [searchQuery, setSearchQuery] = useState('');

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showLeavesModal, setShowLeavesModal] = useState(false);
    const [monthlyLeaves, setMonthlyLeaves] = useState('');

    const [formData, setFormData] = useState({
        basicPay: '',
        salaryInHandPerMonth: '',
        pfDeduction: '',
        esiDeduction: '',
        professionalTax: '',
        incentivesBonus: '',
        individualPaidLeaves: '',
        otherDeductions: [],
        reimbursements: [],
        allowances: [],
        salaryDetailsConfigured: false,
    });

    const [selectedEmployeeForPdf, setSelectedEmployeeForPdf] = useState(null);
    const [showPrintableComponent, setShowPrintableComponent] = useState(false);
    const componentRef = useRef();
    const months = [
        { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
        { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
        { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
        { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    const getAuthHeaders = useCallback(() => {
        if (!token || !user || !user.companyId) {
            setError("Session expired or invalid. Please log in again.");
            logout();
            return null;
        }
        return {
            'Authorization': `Bearer ${token}`,
            'X-Company-ID': user.companyId
        };
    }, [token, user, logout]);

    const fetchEmployeesSalary = async (month, year) => {
        const headers = getAuthHeaders();
        if (!headers) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.get(`${API_BASE_URL}/employees-salary-info?month=${month}&year=${year}`, {
                headers: headers,
                withCredentials: true,
            });
            setEmployeesSalary(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching employee salary info:", err);
            setError(err.response?.data?.message || err.message || "Failed to fetch salary data.");
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user || !token || !user.companyId) {
            logout();
            return;
        }
        fetchEmployeesSalary(selectedMonth, selectedYear);
    }, [selectedMonth, selectedYear, user, token, logout, getAuthHeaders]);

    const handleMonthChange = (e) => {
        setSelectedMonth(parseInt(e.target.value));
    };

    const handleYearChange = (e) => {
        setSelectedYear(parseInt(e.target.value));
    };

    const openEditModal = (employee) => {
        setEditingEmployee(employee);
        const monthYearKey = `${selectedMonth}-${selectedYear}`;
        const currentIndividualLeaves = employee.individualPaidLeaves ? employee.individualPaidLeaves[monthYearKey] : '';
        setFormData({
            basicPay: employee.basicPay ?? '',
            salaryInHandPerMonth: employee.salaryInHandPerMonth ?? '',
            pfDeduction: employee.pfDeduction ?? '',
            esiDeduction: employee.esiDeduction ?? '',
            professionalTax: employee.professionalTax ?? '',
            incentivesBonus: employee.incentivesBonus ?? '',
            individualPaidLeaves: currentIndividualLeaves ?? '',
            otherDeductions: employee.otherDeductions ? [...employee.otherDeductions] : [],
            reimbursements: employee.reimbursements ? [...employee.reimbursements] : [],
            allowances: employee.allowances ? [...employee.allowances] : [],
            salaryDetailsConfigured: employee.salaryDetailsConfigured ?? false,
        });
        setShowEditModal(true);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setEditingEmployee(null);
        setFormData({
            basicPay: '', salaryInHandPerMonth: '', pfDeduction: '', esiDeduction: '', professionalTax: '', incentivesBonus: '', individualPaidLeaves: '', otherDeductions: [], reimbursements: [], allowances: [], salaryDetailsConfigured: false,
        });
    };

    const handleArrayChange = (type, index, field, value) => {
        setFormData(prev => {
            const newArray = [...prev[type]];
            newArray[index] = { ...newArray[index], [field]: value };
            return { ...prev, [type]: newArray };
        });
    };

    const addArrayItem = (type) => {
        setFormData(prev => {
            const newItem = type === 'allowances' ? { title: '', amount: 0 } : { title: '', amount: 0 };
            const newArray = [...prev[type], newItem];
            return { ...prev, [type]: newArray };
        });
    };

    const removeArrayItem = (type, index) => {
        setFormData(prev => {
            const newArray = prev[type].filter((_, i) => i !== index);
            return { ...prev, [type]: newArray };
        });
    };

    const handleUpdateSalaryDetails = async (e) => {
        e.preventDefault();
        setIsUpdating(true);

        const headers = getAuthHeaders();
        if (!headers) {
            setIsUpdating(false);
            return;
        }

        try {
            const dataToSend = {
                ...formData,
                basicPay: formData.basicPay === '' ? 0 : parseFloat(formData.basicPay),
                salaryInHandPerMonth: formData.salaryInHandPerMonth === '' ? 0 : parseFloat(formData.salaryInHandPerMonth),
                pfDeduction: formData.pfDeduction === '' ? 0 : parseFloat(formData.pfDeduction),
                esiDeduction: formData.esiDeduction === '' ? 0 : parseFloat(formData.esiDeduction),
                professionalTax: formData.professionalTax === '' ? 0 : parseFloat(formData.professionalTax),
                incentivesBonus: formData.incentivesBonus === '' ? 0 : parseFloat(formData.incentivesBonus),
                otherDeductions: formData.otherDeductions.map(item => ({ ...item, amount: parseFloat(item.amount) || 0 })),
                reimbursements: formData.reimbursements.map(item => ({ ...item, amount: parseFloat(item.amount) || 0 })),
                allowances: formData.allowances.map(item => ({ ...item, amount: parseFloat(item.amount) || 0 })),
            };

            if (!isNaN(parseFloat(formData.individualPaidLeaves))) {
                const leavesValue = parseFloat(formData.individualPaidLeaves);
                const monthYearKey = `${selectedMonth}-${selectedYear}`;
                dataToSend.individualPaidLeaves = { [monthYearKey]: leavesValue };
            } else {
                dataToSend.individualPaidLeaves = null;
            }

            await axios.put(`${API_BASE_URL}/employees-salary-info/${editingEmployee._id}`, dataToSend, {
                headers: headers,
                withCredentials: true,
            });
            toast.success('Salary details updated successfully!');
            closeEditModal();
            fetchEmployeesSalary(selectedMonth, selectedYear);
        } catch (err) {
            console.error("Error updating salary details:", err.response?.data?.message || err.message);
            toast.error(err.response?.data?.message || err.message || "Failed to update salary details.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateMonthlyLeaves = async () => {
        if (monthlyLeaves === '' || isNaN(monthlyLeaves) || parseFloat(monthlyLeaves) < 0) {
            return toast.error("Please enter a valid number for monthly leaves.");
        }

        setIsUpdating(true);
        const headers = getAuthHeaders();
        if (!headers) {
            setIsUpdating(false);
            return;
        }

        try {
            const response = await axios.put(
                `${API_BASE_URL}/salaries/update-monthly-leaves`,
                { month: selectedMonth, year: selectedYear, leaves: parseFloat(monthlyLeaves) },
                { headers }
            );
            toast.success(response.data.message);
            setShowLeavesModal(false);
            fetchEmployeesSalary(selectedMonth, selectedYear);
        } catch (err) {
            console.error("Error updating monthly leaves:", err.response?.data?.message || err.message);
            toast.error(err.response?.data?.message || err.message || "Failed to update monthly leaves.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handlePrintPdf = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `Salary_Slip_${selectedEmployeeForPdf?.employeeId}_${months[selectedMonth - 1]?.label}_${selectedYear}`,
        onBeforeGetContent: () => {
            setShowPrintableComponent(true);
            return Promise.resolve();
        },
        onAfterPrint: () => {
            setShowPrintableComponent(false);
        }
    });

    const preparePdf = (employee) => {
        setSelectedEmployeeForPdf(employee);
        setTimeout(() => {
            handlePrintPdf();
        }, 500);
    };

    const filteredEmployees = employeesSalary.filter(employee =>
        (employee.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
        (employee.name?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
    );

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
                <div className="d-flex align-items-center">
                    <div className="input-group input-group-sm me-3">
                        <span className="input-group-text"><FaSearch /></span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by ID or Name"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <label htmlFor="monthSelect" className="me-2 mb-0">Month:</label>
                    <select id="monthSelect" className="form-select form-select-sm me-3" value={selectedMonth} onChange={handleMonthChange}>
                        {months.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                    <label htmlFor="yearSelect" className="me-2 mb-0">Year:</label>
                    <select id="yearSelect" className="form-select form-select-sm me-3" value={selectedYear} onChange={handleYearChange}>
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <button className="btn btn-sm btn-light d-flex align-items-center" onClick={() => setShowLeavesModal(true)}>
                        <FaCalendarAlt className="me-2" /> Update Monthly Leaves
                    </button>
                </div>
            </div>

            <div className="card-body d-flex flex-column">
                {loading ? (
                    <Loader />
                ) : error ? (
                    <Message variant="danger">{error}</Message>
                ) : filteredEmployees.length === 0 ? (
                    <Message variant="info">
                        <FaInfoCircle className="me-2" /> No employee data found matching your criteria.
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
                                    <th>Basic Pay</th>
                                    <th>In-Hand Salary</th>
                                    <th>PF/ESI/PT Deductions</th>
                                    <th>Incentives / Bonus</th>
                                    <th>Allowances</th>
                                    <th>Public Leaves</th>
                                    <th>Used Paid Leaves</th>
                                    <th>Paid Days</th>
                                    <th>Gross Salary</th>
                                    <th>Other Deductions</th>
                                    <th>Reimbursements</th>
                                    <th>Net Salary</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.map((employee, index) => (
                                    <tr key={employee._id}>
                                        <td>{index + 1}</td>
                                        <td>{employee.employeeId || 'N/A'}</td>
                                        <td>{employee.name}</td>
                                        <td>{employee.pacsName} {employee.district ? `(${employee.district})` : ''}</td>
                                        <td>₹{(employee.basicPay ?? 0).toFixed(2)}</td>
                                        <td>₹{(employee.salaryInHandPerMonth ?? 0).toFixed(2)}</td>
                                        <td>
                                            PF: ₹{(employee.pfDeduction ?? 0).toFixed(2)} <br />
                                            ESI: ₹{(employee.esiDeduction ?? 0).toFixed(2)} <br />
                                            PT: ₹{(employee.professionalTax ?? 0).toFixed(2)}
                                        </td>
                                        <td>₹{(employee.incentivesBonus ?? 0).toFixed(2)}</td>
                                        <td>
                                            {employee.allowances && employee.allowances.length > 0 ? (
                                                <ul className="list-unstyled mb-0 small">
                                                    {employee.allowances.map((allowance, i) => (
                                                        <li key={i}>{allowance.title}: ₹{(allowance.amount ?? 0).toFixed(2)}</li>
                                                    ))}
                                                    <li className="fw-bold">Total: ₹{employee.calculated.totalAllowances.toFixed(2)}</li>
                                                </ul>
                                            ) : 'N/A'}
                                        </td>
                                        <td>{(employee.calculated.bulkMonthlyLeaves ?? 0).toFixed(1)}</td>
                                        <td>{(employee.calculated.individualPaidLeaves ?? 0).toFixed(1)}</td>
                                        <td>{employee.calculated.paidDays.toFixed(1)}</td>
                                        <td>₹{employee.calculated.grossSalary.toFixed(2)}</td>
                                        <td>
                                            {employee.otherDeductions?.length > 0 ? (
                                                <ul className="list-unstyled mb-0 small">
                                                    {employee.otherDeductions.map((ded, i) => (
                                                        <li key={i}>{ded.title}: ₹{(ded.amount ?? 0).toFixed(2)}</li>
                                                    ))}
                                                    <li className="fw-bold">Total: ₹{employee.calculated.totalCustomDeductions.toFixed(2)}</li>
                                                </ul>
                                            ) : 'N/A'}
                                        </td>
                                        <td>
                                            {employee.reimbursements?.length > 0 ? (
                                                <ul className="list-unstyled mb-0 small">
                                                    {employee.reimbursements.map((reim, i) => (
                                                        <li key={i}>{reim.title}: ₹{(reim.amount ?? 0).toFixed(2)}</li>
                                                    ))}
                                                    <li className="fw-bold">Total: ₹{employee.calculated.totalReimbursements.toFixed(2)}</li>
                                                </ul>
                                            ) : 'N/A'}
                                        </td>
                                        <td className={employee.manualNetSalaryOverride !== null ? 'fw-bold text-primary' : ''}>
                                            ₹{employee.calculated.netSalary.toFixed(2)}
                                            {employee.manualNetSalaryOverride !== null && (
                                                <div className="text-muted small">
                                                    (Override: ₹{(employee.manualNetSalaryOverride ?? 0).toFixed(2)})
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="d-flex flex-column gap-1">
                                                <button className="btn btn-sm btn-info" onClick={() => openEditModal(employee)}>
                                                    <FaEdit /> Edit
                                                </button>
                                                <button className="btn btn-sm btn-danger mt-1" onClick={() => preparePdf(employee)}>
                                                    <FaFilePdf /> PDF
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showEditModal && editingEmployee && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-lg" role="document">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">Edit Details for {editingEmployee.name} ({editingEmployee.employeeId})</h5>
                                <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={closeEditModal}></button>
                            </div>
                            <form onSubmit={handleUpdateSalaryDetails}>
                                <div className="modal-body">
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label htmlFor="basicPay" className="form-label">Basic Pay (Monthly)</label>
                                            <input type="number" step="0.01" className="form-control" id="basicPay" name="basicPay" value={formData.basicPay} onChange={(e) => setFormData({ ...formData, basicPay: e.target.value })} />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="salaryInHandPerMonth" className="form-label">Monthly In-Hand Salary</label>
                                            <input type="number" step="0.01" className="form-control" id="salaryInHandPerMonth" name="salaryInHandPerMonth" value={formData.salaryInHandPerMonth} onChange={(e) => setFormData({ ...formData, salaryInHandPerMonth: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label htmlFor="pfDeduction" className="form-label">PF Deduction (Monthly)</label>
                                            <input type="number" step="0.01" className="form-control" id="pfDeduction" name="pfDeduction" value={formData.pfDeduction} onChange={(e) => setFormData({ ...formData, pfDeduction: e.target.value })} />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="esiDeduction" className="form-label">ESI Deduction (Monthly)</label>
                                            <input type="number" step="0.01" className="form-control" id="esiDeduction" name="esiDeduction" value={formData.esiDeduction} onChange={(e) => setFormData({ ...formData, esiDeduction: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label htmlFor="professionalTax" className="form-label">Professional Tax (Monthly)</label>
                                            <input type="number" step="0.01" className="form-control" id="professionalTax" name="professionalTax" value={formData.professionalTax} onChange={(e) => setFormData({ ...formData, professionalTax: e.target.value })} />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="incentivesBonus" className="form-label">Incentives / Bonus (Monthly)</label>
                                            <input type="number" step="0.01" className="form-control" id="incentivesBonus" name="incentivesBonus" value={formData.incentivesBonus} onChange={(e) => setFormData({ ...formData, incentivesBonus: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label htmlFor="individualPaidLeaves" className="form-label">User Paid Leaves</label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                className="form-control"
                                                id="individualPaidLeaves"
                                                name="individualPaidLeaves"
                                                value={formData.individualPaidLeaves}
                                                onChange={(e) => setFormData({ ...formData, individualPaidLeaves: e.target.value })}
                                            />
                                            <p className="mt-1 text-muted small">
                                                **Note:** 1 = 1 full day, 0.5 = a half day.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-3 border p-3 rounded bg-light">
                                        <h6 className="d-flex justify-content-between align-items-center">
                                            Allowances
                                            <button type="button" className="btn btn-sm btn-primary" onClick={() => addArrayItem('allowances')}>+ Add Allowance</button>
                                        </h6>
                                        {formData.allowances.map((allowance, index) => (
                                            <div key={index} className="row mb-2 align-items-center bg-white p-2 rounded shadow-sm">
                                                <div className="col-5">
                                                    <input type="text" className="form-control form-control-sm" placeholder="Title (e.g., Home Allowance)" value={allowance.title} onChange={(e) => handleArrayChange('allowances', index, 'title', e.target.value)} />
                                                </div>
                                                <div className="col-5">
                                                    <input type="number" step="0.01" className="form-control form-control-sm" placeholder="Amount" value={allowance.amount} onChange={(e) => handleArrayChange('allowances', index, 'amount', e.target.value)} />
                                                </div>
                                                <div className="col-2 text-end">
                                                    <button type="button" className="btn btn-sm btn-danger" onClick={() => removeArrayItem('allowances', index)}>&times;</button>
                                                </div>
                                            </div>
                                        ))}
                                        {formData.allowances.length === 0 && <p className="text-muted small">No allowances added.</p>}
                                    </div>
                                    <div className="mb-3">
                                        <div className="form-check">
                                            <input className="form-check-input" type="checkbox" id="salaryDetailsConfigured" name="salaryDetailsConfigured" checked={formData.salaryDetailsConfigured} onChange={(e) => setFormData({ ...formData, salaryDetailsConfigured: e.target.checked })} />
                                            <label className="form-check-label" htmlFor="salaryDetailsConfigured">
                                                Salary Details Configured
                                            </label>
                                        </div>
                                    </div>

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

            {showPrintableComponent && (
                <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                    <SalarySlipTemplate
                        ref={componentRef}
                        employeeData={selectedEmployeeForPdf}
                        month={months[selectedMonth - 1]?.label}
                        year={selectedYear}
                    />
                </div>
            )}

            <Modal
                title="Update Monthly Leaves"
                open={showLeavesModal}
                onOk={handleUpdateMonthlyLeaves}
                onCancel={() => setShowLeavesModal(false)}
                confirmLoading={isUpdating}
                footer={[
                    <Button key="back" onClick={() => setShowLeavesModal(false)}>
                        Cancel
                    </Button>,
                    <Button key="submit" type="primary" onClick={handleUpdateMonthlyLeaves} loading={isUpdating}>
                        Update Leaves
                    </Button>,
                ]}
            >
                <Form layout="vertical">
                    <Form.Item label={`Total Leaves (including offs & festivals) for ${months[selectedMonth - 1]?.label} ${selectedYear}`}>
                        <InputNumber
                            min={0}
                            step={0.5}
                            value={monthlyLeaves}
                            onChange={(value) => setMonthlyLeaves(value)}
                            style={{ width: '100%' }}
                            placeholder="e.g., 4.5 for 4 and a half days"
                        />
                        <p className="mt-2 text-muted small">
                            **Note:** 1 = 1 full day, 0.5 = a half day. This will be applied to all employees.
                        </p>
                    </Form.Item>
                </Form>
            </Modal>
        </motion.div>
    );
};

export default EmployeeSalaryInformation;
