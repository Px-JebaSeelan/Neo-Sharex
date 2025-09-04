import React from 'react';

const Notification = React.memo(({ message, type = 'info', onClose }) => {
  if (!message) return null;
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      onClose();
    }
  };
  return (
    <div className={`neo-notification neo-notification-${type}`} role="alert" tabIndex={0} onKeyDown={handleKeyDown} aria-live="polite">
      {message}
      <button className="neo-notification-close" onClick={onClose} aria-label="Close notification">&times;</button>
    </div>
  );
});

export default Notification;
