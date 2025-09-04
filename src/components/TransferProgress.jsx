
// src/components/TransferProgress.jsx


import React from 'react';
import { useMotionValue, useSpring } from 'framer-motion';
// Show file icon based on type
const getFileIcon = (file) => {
  if (!file || !file.type) return '📄';
  if (file.type.startsWith('image/')) return '🖼️';
  if (file.type.startsWith('video/')) return '🎬';
  if (file.type.startsWith('audio/')) return '🎵';
  if (file.type === 'application/pdf') return '📄';
  if (file.type.startsWith('text/')) return '📄';
  return '📦';
};


/**
 * TransferProgress component displays a professional animated progress bar with real-time speed, ETA, and transferred data.
 * @param {{
 *   file: { name: string, size: number, type: string },
 *   progress: number,
 *   status: React.ReactNode,
 *   highlight?: boolean,
 *   bytesTransferred?: number,
 *   startTime?: number
 * }} props
 * @returns {JSX.Element}
 */
const TransferProgress = React.memo(({ file, progress, status, highlight, bytesTransferred, startTime }) => {
  // Format bytes to human readable
  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Calculate speed (MB/s) and ETA (seconds)
  let speed = 0, eta = 0;
  if (bytesTransferred && startTime && file?.size) {
    const elapsed = (Date.now() - startTime) / 1000; // seconds
    speed = elapsed > 0 ? bytesTransferred / elapsed : 0; // bytes/sec
    eta = speed > 0 ? (file.size - bytesTransferred) / speed : 0; // seconds
  }

  // Format speed and ETA
  const speedStr = speed > 0 ? `${(speed / 1024 / 1024).toFixed(2)} MB/s` : '--';
  const etaStr = eta > 0 ? `${Math.floor(eta/60)}:${('0'+Math.floor(eta%60)).slice(-2)} min` : '--';

  // Animated percentage for the progress bar
  const animatedProgress = useMotionValue(progress);
  React.useEffect(() => {
    animatedProgress.set(progress);
  }, [progress, animatedProgress]);

  const roundedProgress = useSpring(animatedProgress, { stiffness: 120, damping: 18 });

  return (
    <motion.div
      className={`transfer-progress glassy-card${highlight ? ' transfer-progress-current' : ''}`}
      style={{
        maxWidth: '100%',
        width: '100%',
        boxSizing: 'border-box',
        margin: '0 auto',
        ...(highlight ? {boxShadow:'0 0 0 2px #00e5ff66, 0 2px 16px #00e5ff44'} : {}),
        padding: '1.1em 1em',
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      layout
    >
      <div className="file-info">
        <span style={{fontSize:'1.5em',marginRight:'0.7em'}}>{getFileIcon(file)}</span>
        <span style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: '#00e5ff',
          fontWeight: 700,
          fontSize: '1.12em',
          letterSpacing: '0.01em',
        }}>{file.name}</span>
        <span style={{
          marginLeft: '1em',
          fontWeight: 500,
          color: '#b2ebf2',
          fontSize: '1em',
        }}>{formatBytes(file.size)}</span>
      </div>
      <div className="creative-progress-bar-container" style={{position:'relative', width:'100%', height:'28px', margin:'0.7em 0'}}>
        {/* Progress Bar Background */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '12px',
            background: 'linear-gradient(90deg, #101c3a 70%, #00e5ff22 100%)',
            boxShadow: '0 2px 12px #00e5ff11',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
            overflow: 'hidden',
          }}
        />
        {/* Progress Bar Fill */}
        <motion.div
          className="creative-progress-bar shimmer-effect"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            borderRadius: '12px',
            background: 'linear-gradient(90deg, #00e5ff 0%, #00bfff 100%)',
            boxShadow: '0 4px 24px #00e5ff33, 0 0 8px #00e5ff99',
            zIndex: 2,
            minWidth: '2%',
          }}
        />
        {/* Centered Animated Percentage Label */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        >
          <motion.span
            style={{
              fontWeight: 800,
              fontSize: '1.08em',
              color: progress > 50 ? '#fff' : '#00e5ff',
              textShadow: progress > 50 ? '0 2px 8px #00e5ff99' : '0 2px 8px #101c3a',
              background: progress > 50 ? 'rgba(0,229,255,0.18)' : 'rgba(16,28,58,0.18)',
              border: '1.5px solid #00e5ff55',
              borderRadius: '8px',
              padding: '0.1em 0.7em',
              boxShadow: '0 2px 12px #00e5ff33',
              backdropFilter: 'blur(2.5px)',
              transition: 'color 0.2s, background 0.2s',
              minWidth: '3.5em',
              textAlign: 'center',
              letterSpacing: '0.01em',
            }}
          >
            {Math.round(roundedProgress.get())}%
          </motion.span>
        </motion.div>
      </div>
      <div className="progress-meta" style={{display:'flex',justifyContent:'space-between',marginTop:'0.7em',fontSize:'1.01em',color:'#b2ebf2',fontWeight:600}}>
        <span>Speed: <span style={{color:'#00e5ff',fontWeight:700}}>{speedStr}</span></span>
        <span>ETA: <span style={{color:'#00e5ff',fontWeight:700}}>{etaStr}</span></span>
        <span>Transferred: <span style={{color:'#00e5ff',fontWeight:700}}>{formatBytes(bytesTransferred||0)}</span></span>
      </div>
      <p className="transfer-status" style={{color: highlight ? '#00e5ff' : undefined,marginTop:'1.2em',fontSize:'1.08em',fontWeight:600,letterSpacing:'0.01em'}}>{status}</p>
    </motion.div>
  );
});

export default TransferProgress;