import React from 'react';

const Fab = React.memo(({ icon, label, onClick }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };
  return (
    <button
      className="neo-fab"
      onClick={onClick}
      aria-label={label}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{outline:'none'}}
    >
      {icon}
    </button>
  );
});

export default Fab;
