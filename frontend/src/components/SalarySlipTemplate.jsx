import React, { forwardRef } from 'react';

const SalarySlipTemplate = forwardRef(({ employeeData, companyInfo, month, year }, ref) => {
    if (!employeeData) {
        return <div className="salary-slip-container">No employee data to display.</div>;
    }

    const {
        name,
        pacsId,
        pacsName,
        district,
        userType,
        salaryInHandPerMonth,
        fixedAllowances,
        incentive,
        otherDeductions,
        reimbursements,
        allowances,
        calculated
    } = employeeData;

    const {
        paidDays,
        totalActualWorkingHours,
        bulkMonthlyLeaves,
        individualPaidLeaves,
        grossSalary,
        calculatedEmployeeEPF,
        calculatedEmployeeESIC,
        totalCustomDeductions,
        totalReimbursements,
        lopAmount,
        netSalary
    } = calculated;

    // Helper function to format currency
    const formatCurrency = (amount) => {
        return `₹${(amount || 0).toFixed(2)}`;
    };

    return (
        <div ref={ref} className="salary-slip-container p-5" style={{ fontFamily: 'Arial, sans-serif' }}>
            {/* --- NEW: Company Info Header --- */}
            <div className="text-center mb-4">
                {companyInfo.logoUrl && (
                    <img src={companyInfo.logoUrl} alt="Company Logo" className="mb-2" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                )}
                <h2 className="company-name fw-bold" style={{ color: '#2c3e50', textTransform: 'uppercase' }}>
                    {companyInfo.payslipName || 'Company Name'}
                </h2>
                <h5 className="payslip-title fw-bold" style={{ color: '#34495e', borderBottom: '2px solid #34495e', paddingBottom: '5px' }}>
                    PAYSLIP FOR THE MONTH OF {month.toUpperCase()}, {year}
                </h5>
            </div>

            <div className="employee-info mb-4 border p-3 rounded" style={{ backgroundColor: '#f9f9f9', border: '1px solid #ddd' }}>
                <div className="row">
                    <div className="col-md-6">
                        <p><strong>Employee Name:</strong> {name}</p>
                        <p><strong>Employee ID:</strong> {pacsId}</p>
                        <p><strong>Designation:</strong> {userType === 'pacs' ? 'PACS Manager' : 'Employee'}</p>
                    </div>
                    <div className="col-md-6">
                        <p><strong>PACS Name:</strong> {pacsName}</p>
                        <p><strong>District:</strong> {district}</p>
                        <p><strong>Location:</strong> {employeeData.location}</p>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-md-6">
                    <div className="earnings-section border p-3 rounded h-100" style={{ border: '1px solid #28a745' }}>
                        <h5 className="section-title fw-bold text-success mb-3">EARNINGS</h5>
                        <table className="table table-sm table-borderless">
                            <tbody>
                                <tr>
                                    <td>Monthly In-Hand Salary</td>
                                    <td className="text-end">{formatCurrency(salaryInHandPerMonth)}</td>
                                </tr>
                                <tr>
                                    <td>Fixed Allowances</td>
                                    <td className="text-end">{formatCurrency(fixedAllowances)}</td>
                                </tr>
                                <tr>
                                    <td>Incentives / Bonus</td>
                                    <td className="text-end">{formatCurrency(incentive)}</td>
                                </tr>
                                {/* --- NEW: Dynamic Allowances --- */}
                                {allowances && allowances.map((allowance, index) => (
                                    <tr key={index}>
                                        <td>{allowance.title}</td>
                                        <td className="text-end">{formatCurrency(allowance.amount)}</td>
                                    </tr>
                                ))}
                                <tr>
                                    <td className="fw-bold">Gross Salary</td>
                                    <td className="fw-bold text-end">{formatCurrency(grossSalary)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="deductions-section border p-3 rounded h-100" style={{ border: '1px solid #dc3545' }}>
                        <h5 className="section-title fw-bold text-danger mb-3">DEDUCTIONS</h5>
                        <table className="table table-sm table-borderless">
                            <tbody>
                                <tr>
                                    <td>PF Deduction</td>
                                    <td className="text-end">{formatCurrency(calculatedEmployeeEPF)}</td>
                                </tr>
                                <tr>
                                    <td>ESI Deduction</td>
                                    <td className="text-end">{formatCurrency(calculatedEmployeeESIC)}</td>
                                </tr>
                                {/* --- NEW: LOP/LWP Deduction --- */}
                                <tr>
                                    <td className="text-danger fw-bold">LOP / LWP</td>
                                    <td className="text-danger fw-bold text-end">{formatCurrency(lopAmount)}</td>
                                </tr>
                                {otherDeductions && otherDeductions.map((deduction, index) => (
                                    <tr key={index}>
                                        <td>{deduction.title}</td>
                                        <td className="text-end">{formatCurrency(deduction.amount)}</td>
                                    </tr>
                                ))}
                                <tr>
                                    <td className="fw-bold">Total Deductions</td>
                                    <td className="fw-bold text-end">{formatCurrency(calculatedEmployeeEPF + calculatedEmployeeESIC + totalCustomDeductions + lopAmount)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="row mt-4">
                <div className="col-md-6">
                    <div className="reimbursements-section border p-3 rounded h-100" style={{ border: '1px solid #0dcaf0' }}>
                        <h5 className="section-title fw-bold text-info mb-3">REIMBURSEMENTS</h5>
                        <table className="table table-sm table-borderless">
                            <tbody>
                                {reimbursements && reimbursements.map((reimbursement, index) => (
                                    <tr key={index}>
                                        <td>{reimbursement.title}</td>
                                        <td className="text-end">{formatCurrency(reimbursement.amount)}</td>
                                    </tr>
                                ))}
                                <tr>
                                    <td className="fw-bold">Total Reimbursements</td>
                                    <td className="fw-bold text-end">{formatCurrency(totalReimbursements)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="leaves-section border p-3 rounded h-100" style={{ border: '1px solid #ffc107' }}>
                        <h5 className="section-title fw-bold text-warning mb-3">LEAVES & ATTENDANCE</h5>
                        <table className="table table-sm table-borderless">
                            <tbody>
                                <tr>
                                    <td>Total Days in Month</td>
                                    <td className="text-end">{new Date(year, month, 0).getDate()}</td>
                                </tr>
                                <tr>
                                    <td>Actual Working Days</td>
                                    <td className="text-end">{paidDays}</td>
                                </tr>
                                <tr>
                                    <td>Total Public Leaves</td>
                                    <td className="text-end">{bulkMonthlyLeaves}</td>
                                </tr>
                                <tr>
                                    <td>Individual Paid Leaves</td>
                                    <td className="text-end">{individualPaidLeaves}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="net-salary-section text-center p-3 rounded mt-4" style={{ backgroundColor: '#e9ecef', border: '2px solid #007bff' }}>
                <h4 className="net-salary-title fw-bold text-primary mb-3">NET SALARY</h4>
                <p className="net-salary-amount fw-bold" style={{ fontSize: '2rem' }}>
                    {formatCurrency(netSalary)}
                </p>
                <p className="fw-bold text-muted small">
                    (Rupees {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(netSalary).replace('₹', '')} Only)
                </p>
            </div>
            
            <div className="footer text-muted text-center small mt-5">
                <p>This is a computer generated payslip, therefore no signature is required.</p>
                <p>Generated on: {new Date().toLocaleDateString('en-IN')}</p>
            </div>
        </div>
    );
});

export default SalarySlipTemplate;