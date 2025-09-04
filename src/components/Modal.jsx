import React from 'react';

const Modal = React.memo(({ open, onClose, children }) => {
  const modalRef = React.useRef();
  React.useEffect(() => {
    if (open && modalRef.current) {
      modalRef.current.focus();
    }
  }, [open]);
  if (!open) return null;
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };
  return (
    <div className="neo-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="neo-modal"
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
        ref={modalRef}
        onKeyDown={handleKeyDown}
        aria-label="Dialog"
      >
        <button className="neo-modal-close" onClick={onClose} aria-label="Close dialog">&times;</button>
        {children}
      </div>
    </div>
  );
});

export default Modal;
