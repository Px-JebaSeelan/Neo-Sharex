import React from 'react';

const PauseResumeCancel = React.memo(({ onPause, onResume, onCancel, isPaused, isActive }) => (
  <div className="pause-resume-cancel-controls">
    {isActive && !isPaused && (
      <button className="btn btn-secondary" onClick={onPause}>Pause</button>
    )}
    {isActive && isPaused && (
      <button className="btn btn-primary" onClick={onResume}>Resume</button>
    )}
    {isActive && (
      <button className="btn btn-danger" onClick={onCancel} style={{marginLeft:'0.7em'}}>Cancel</button>
    )}
  </div>
));

export default PauseResumeCancel;
