// src/components/SalarySlipTemplate.jsx
import React from 'react';

// Step 1: Wrap your component with React.forwardRef
const SalarySlipTemplate = React.forwardRef(({ employeeData, month, year }, ref) => {
  if (!employeeData) {
    return null; // Don't render anything if no data is provided
  }

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toFixed(2)}`;
  };

  // Helper function to calculate total of an array of objects
  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  const totalDeductions = (employeeData.calculated.calculatedEmployeeEPF + employeeData.calculated.calculatedEmployeeESIC + employeeData.calculated.totalCustomDeductions);
  const totalEarnings = (employeeData.calculated.attendanceAdjustedSalary + employeeData.fixedAllowances + employeeData.incentive + employeeData.calculated.totalReimbursements);
  const finalNetSalary = totalEarnings - totalDeductions;

  return (
    // Step 2: Attach the received `ref` to a parent element (e.g., a div)
    <div ref={ref} style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <h1 style={styles.h1}>Salary Slip</h1>
        <h2 style={styles.h2}>{month} {year}</h2>
      </div>

      {/* Employee Details */}
      <div style={styles.section}>
        <p style={styles.p}><strong>Employee ID:</strong> {employeeData.pacsId}</p>
        <p style={styles.p}><strong>Employee Name:</strong> {employeeData.name}</p>
        <p style={styles.p}><strong>Office / District:</strong> {employeeData.pacsName} {employeeData.district ? `(${employeeData.district})` : ''}</p>
      </div>

      {/* Earnings and Deductions Table */}
      <div style={styles.tableContainer}>
        <div style={styles.tableColumn}>
          <h3 style={styles.tableHeading}>Earnings</h3>
          <table style={styles.table}>
            <tbody>
              <tr>
                <td style={styles.td}>Base Salary (In Hand)</td>
                <td style={styles.td}>{formatCurrency(employeeData.salaryInHandPerMonth)}</td>
              </tr>
              <tr>
                <td style={styles.td}>Attendance Adjusted Salary</td>
                <td style={styles.td}>{formatCurrency(employeeData.calculated.attendanceAdjustedSalary)}</td>
              </tr>
              <tr>
                <td style={styles.td}>Fixed Allowances</td>
                <td style={styles.td}>{formatCurrency(employeeData.fixedAllowances)}</td>
              </tr>
              <tr>
                <td style={styles.td}>Incentive</td>
                <td style={styles.td}>{formatCurrency(employeeData.incentive)}</td>
              </tr>
              {employeeData.reimbursements && employeeData.reimbursements.map((item, index) => (
                <tr key={`reimbursement-${index}`}>
                  <td style={styles.td}>{item.title}</td>
                  <td style={styles.td}>{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr>
                <td style={{ ...styles.td, ...styles.bold }}>Total Earnings</td>
                <td style={{ ...styles.td, ...styles.bold }}>{formatCurrency(totalEarnings)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={styles.tableColumn}>
          <h3 style={styles.tableHeading}>Deductions</h3>
          <table style={styles.table}>
            <tbody>
              <tr>
                <td style={styles.td}>Employee PF</td>
                <td style={styles.td}>{formatCurrency(employeeData.calculated.calculatedEmployeeEPF)}</td>
              </tr>
              <tr>
                <td style={styles.td}>Employee ESI</td>
                <td style={styles.td}>{formatCurrency(employeeData.calculated.calculatedEmployeeESIC)}</td>
              </tr>
              {employeeData.otherDeductions && employeeData.otherDeductions.map((item, index) => (
                <tr key={`deduction-${index}`}>
                  <td style={styles.td}>{item.title}</td>
                  <td style={styles.td}>{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr>
                <td style={{ ...styles.td, ...styles.bold }}>Total Deductions</td>
                <td style={{ ...styles.td, ...styles.bold }}>{formatCurrency(totalDeductions)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Net Salary Section */}
      <div style={styles.footer}>
        <p style={styles.netSalary}>
          <strong>Net Salary:</strong> {formatCurrency(finalNetSalary)}
          {employeeData.manualNetSalaryOverride !== null && (
            <span style={styles.overrideNote}>(Manually Overridden)</span>
          )}
        </p>
      </div>

    </div>
  );
});

// A simple style object for the component
const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    border: '1px solid #ccc',
    maxWidth: '800px',
    margin: 'auto',
    backgroundColor: '#fff',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  h1: {
    fontSize: '24px',
    margin: '0',
    color: '#333',
  },
  h2: {
    fontSize: '18px',
    margin: '0',
    color: '#555',
  },
  section: {
    border: '1px solid #eee',
    padding: '10px',
    marginBottom: '20px',
    backgroundColor: '#f9f9f9',
  },
  p: {
    margin: '5px 0',
  },
  tableContainer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  tableColumn: {
    flex: 1,
    margin: '0 10px',
  },
  tableHeading: {
    fontSize: '16px',
    borderBottom: '2px solid #333',
    paddingBottom: '5px',
    marginBottom: '10px',
    color: '#333',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  td: {
    borderBottom: '1px solid #eee',
    padding: '8px 0',
    fontSize: '14px',
  },
  bold: {
    fontWeight: 'bold',
  },
  footer: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '2px solid #333',
    textAlign: 'right',
  },
  netSalary: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#007bff',
  },
  overrideNote: {
    fontSize: '12px',
    fontWeight: 'normal',
    color: '#888',
    marginLeft: '10px',
  }
};


export default SalarySlipTemplate;