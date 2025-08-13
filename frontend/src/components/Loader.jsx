// frontend/src/components/Loader.jsx
import React from 'react';
import { FaSpinner } from 'react-icons/fa';

const Loader = () => {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100%', minHeight: '150px' }}>
      <FaSpinner className="fa-spin me-2" size={32} /> Loading... {/* Changed size="2x" to size={32} */}
    </div>
  );
};

export default Loader;