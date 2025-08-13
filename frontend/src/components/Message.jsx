// frontend/src/components/Message.jsx
import React from 'react';

const Message = ({ variant, children }) => {
  // Bootstrap alert classes: alert-primary, alert-secondary, alert-success, alert-danger, etc.
  return (
    <div className={`alert alert-${variant}`} role="alert">
      {children}
    </div>
  );
};

Message.defaultProps = {
  variant: 'info', // Default to info styling if no variant is provided
};

export default Message;