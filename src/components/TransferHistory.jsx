import React from 'react';

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const TransferHistory = React.memo(({ history, onClear }) => {
  // Export history as JSON
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'neo-sharex-history.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import history from JSON
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (Array.isArray(imported)) {
          localStorage.setItem('neoShareHistory', JSON.stringify(imported));
          window.location.reload();
        }
      } finally {
        // intentionally empty: no cleanup needed
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="transfer-history-panel">
      <div className="transfer-history-header" style={{flexWrap:'wrap',gap:'0.7em'}}>
        <span style={{fontSize:'1.1em',fontWeight:700}}>Session History</span>
        <div style={{display:'flex',flexWrap:'wrap',gap:'0.7em',marginLeft:'auto'}}>
          <button className="btn btn-secondary" style={{minWidth:'90px',padding:'0.7em 1.2em'}} onClick={onClear}>Clear</button>
          <button className="btn btn-secondary" style={{minWidth:'90px',padding:'0.7em 1.2em'}} onClick={handleExport}>Export</button>
          <label className="btn btn-secondary" style={{minWidth:'90px',padding:'0.7em 1.2em',cursor:'pointer'}}>
            <span style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%',fontWeight:500}}>Import</span>
            <input type="file" accept="application/json" style={{display:'none'}} onChange={handleImport} />
          </label>
        </div>
      </div>
      <div className="transfer-history-list">
        {history.length === 0 ? (
          <div className="transfer-history-empty">No history yet.</div>
        ) : (
          history.map((item, idx) => (
            <div className="transfer-history-item" key={idx}>
              <span style={{fontSize:'1.2em',marginRight:'0.5em'}}>{item.direction === 'sent' ? '⬆️' : '⬇️'}</span>
              <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</span>
              <span style={{marginLeft:'1em'}}>{formatBytes(item.size)}</span>
              <span style={{marginLeft:'1em',fontSize:'0.95em',color:'#888'}}>{new Date(item.date).toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

export default TransferHistory;
