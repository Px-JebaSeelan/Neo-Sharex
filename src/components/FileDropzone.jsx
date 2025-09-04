import React, { useCallback } from 'react';
// import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import './FileDropzone.css';


/**
 * FileDropzone supports multiple files/folders drag-and-drop and touch feedback.
 * @param {{ onFilesAccepted: (files: File[]) => void }} props
 * @returns {JSX.Element}
 */
const FileDropzone = React.memo(({ onFilesAccepted }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      onFilesAccepted(acceptedFiles);
    }
  }, [onFilesAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: true,
    onDrop,
    // Enable folder drag-and-drop (webkitdirectory)
    useFsAccessApi: true
  });

  // Touch feedback: highlight on tap
  const [touchActive, setTouchActive] = React.useState(false);

  return (
    <motion.div
      {...getRootProps()}
      className={`file-dropzone${isDragActive || touchActive ? ' active' : ''}`}
      tabIndex={0}
      role="button"
      aria-label="Add files or folders"
      aria-describedby="file-drop-desc"
      whileHover={{ scale: 1.03, boxShadow: '0 2px 16px #00e5ff33' }}
      whileTap={{ scale: 0.98, backgroundColor: 'rgba(0,229,255,0.08)' }}
      onTouchStart={() => setTouchActive(true)}
      onTouchEnd={() => setTouchActive(false)}
      onTouchCancel={() => setTouchActive(false)}
      style={{ outline: 'none', transition: 'box-shadow 0.2s' }}
    >
      <input {...getInputProps()} webkitdirectory="true" directory="true" multiple />
      <p id="file-drop-desc">Drag & drop files or folders here, or click to select</p>
    </motion.div>
  );
});

export default FileDropzone;
