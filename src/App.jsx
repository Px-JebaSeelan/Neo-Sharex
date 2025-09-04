import ChidoriEffect from './components/ChidoriEffect';
// src/App.jsx

import React, { useState, useRef, useEffect } from 'react';
// ...existing code...
import { AnimatePresence } from 'framer-motion';
import { db } from './firebase';
import { collection, doc, setDoc, getDoc, updateDoc, addDoc, onSnapshot, serverTimestamp, deleteDoc } from 'firebase/firestore';
/**
 * Deletes session data from Firestore when a session is closed.
 * @param {string} sessionCode - The session code to delete from Firestore.
 * @returns {Promise<void>}
 */
const deleteSessionFromFirestore = async (sessionCode) => {
  if (!sessionCode) return;
  try {
    await deleteDoc(doc(db, 'sessions', sessionCode));
    // If you store candidates or other subcollections, delete them as well (optional, not recursive by default)
    // Example: await deleteDoc(doc(db, `sessions/${sessionCode}/candidates`, 'offer'));
  } catch (e) {
    console.error('Failed to delete session from Firestore:', e);
  }
};
import { QRCodeCanvas } from 'qrcode.react';
import FileDropzone from './components/FileDropzone';
import TransferProgressRaw from './components/TransferProgress';
import FilePreview from './components/FilePreview';
import PauseResumeCancelRaw from './components/PauseResumeCancel';
import TransferHistory from './components/TransferHistory';
import Stepper from './components/Stepper';
import Modal from './components/Modal';
import Notification from './components/Notification';
import Fab from './components/Fab';
import Tooltip from './components/Tooltip';
import ConstellationBackground from './components/ConstellationBackground';

// Memoize pure components for performance
const TransferProgress = React.memo(TransferProgressRaw);
const PauseResumeCancel = React.memo(PauseResumeCancelRaw);
import './App.css';

// --- WebRTC STUN servers configuration ---
// Used for NAT traversal and peer-to-peer connection setup
const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
    {
      urls: ['turn:relay1.example.com:3478'],
      username: 'neo-sharex',
      credential: 'securepassword'
    }
  ],
  iceCandidatePoolSize: 10,
};

/**
 * Main Neo Sharex App component. Handles session, file transfer, and UI state.
 * @returns {JSX.Element}
 */
function App() {
  // --- State declarations (must be before useEffect hooks) ---
  // Core state for app flow
  const [step, setStep] = useState(0); // 0: Home, 1: Session, 2: Connected, 3: File
  const [mode, setMode] = useState('home'); // home, send, receive, connected
  const [sessionCode, setSessionCode] = useState('');
  
  // UI state
  const [toast, setToast] = useState("");
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState("");
  // ...existing state declarations...

  // --- Low-memory device warning ---
  useEffect(() => {
    if (navigator.deviceMemory && navigator.deviceMemory < 2) {
      setToast('⚠️ Your device has limited memory. Large file transfers may be slow or unstable.');
    }
  }, []);
  // --- Browser history management for step navigation ---
  useEffect(() => {
  const handlePopState = () => {
      // Only handle if not at home
      if (step > 0) {
        setStep(prev => Math.max(0, prev - 1));
        // Optionally update mode based on step
        if (step === 1) setMode('home');
        if (step === 2) setMode(sessionCode ? 'send' : 'receive');
        if (step === 3) setMode('connected');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [step, sessionCode]);

  // Push state on step change (except initial)
  useEffect(() => {
    if (step > 0) {
      window.history.pushState({ step }, '', window.location.pathname + window.location.search);
    }
  }, [step]);
  // Email popup state
  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(""), 1200);
    // Open Gmail compose with the email address
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`,'_blank');
  };
  // Close email popup on Escape key
  React.useEffect(() => {
    if (!showEmailPopup) return;
  const handleKey = (e) => {
      if (e.key === 'Escape') setShowEmailPopup(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showEmailPopup]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  // --- Browser/Feature Checks ---
  useEffect(() => {
    let unsupported = false;
    if (!window.RTCPeerConnection || !window.FileReader) {
      unsupported = true;
    }
    if (!navigator.clipboard) {
      unsupported = true;
    }
    // Add more checks as needed
    if (unsupported) {
      setError('🚫 Your browser does not support required features for peer-to-peer file transfer (WebRTC, FileReader, Clipboard). Please use a modern browser like Chrome, Edge, or Firefox.');
    }
  }, []);

  // --- Large File Warning (e.g., > 500MB) ---
  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
  // Remove pause/resume/cancel/resumable state for simplicity
  // --- Transfer History ---
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('neoShareHistory') || '[]');
    } catch { return []; }
  });
  const addHistory = (item) => {
    setHistory(prev => {
      const updated = [item, ...prev].slice(0, 50); // keep last 50
      localStorage.setItem('neoShareHistory', JSON.stringify(updated));
      return updated;
    });
  };
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('neoShareHistory');
  };
  // --- Current Session Files ---
  const [currentSessionFiles, setCurrentSessionFiles] = useState([]);
  // --- Auto-join via QR code link ---
  // If a ?code=XXXXXX param is present, auto-fill and switch to receive mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && code.length === 6) {
      setSessionCode(code.toUpperCase());
      setMode('receive');
      setStep(1);
    }
  }, []);
  // --- Interactive logo ball state (follows mouse in viewport) ---
  // Real-time interactive logo ball state
  const [ballPos, setBallPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
  const handleMouseMove = (e) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // -1 to 1 range, centered at viewport center
      const x = ((e.clientX - vw / 2) / (vw / 2));
      const y = ((e.clientY - vh / 2) / (vh / 2));
      setBallPos({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // --- FileDropzone callback (fixes React hook rules) ---
  const handleFilesAccepted = React.useCallback(files => {
    const tooLarge = files.find(f => f.size > MAX_FILE_SIZE);
    if (tooLarge) {
      setError(`File "${tooLarge.name}" is too large (max 500MB). Please select a smaller file.`);
      return;
    }
    setFilesToSend(files);
    setCurrentFileIndex(0);
    setStep(3);
  }, [MAX_FILE_SIZE]);

  // Remove pause/resume/cancel callbacks
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [showModal, setShowModal] = useState(false);
  // Theme: 'dark', 'light', 'custom'
  const theme = 'dark';
  const [dataChannel, setDataChannel] = useState(null);
  // Support multiple files
  const [filesToSend, setFilesToSend] = useState([]); // Array of File
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [transferStatus, setTransferStatus] = useState('Awaiting connection...');
  const [progress, setProgress] = useState(0);
  const [perFileProgress, setPerFileProgress] = useState([]); // Array of progress %
  const [bytesTransferred, setBytesTransferred] = useState(0);
  const [transferStartTime, setTransferStartTime] = useState(null);
  const [receivedMeta, setReceivedMeta] = useState(null); // { name, size, type }
  const [showDownload, setShowDownload] = useState(false);
  // Add state to track last sent file for sender status
  const [lastSentFile, setLastSentFile] = useState(null);
  
  const pc = useRef(null);
  // Add a ref for receivedMeta
  const receivedMetaRef = useRef(null);

  /**
   * createSession
   * Host creates a new session, generates a 6-char code, and sets up signaling in Firestore.
   * - Sets up local WebRTC peer connection and data channel
   * - Writes offer SDP and ICE candidates to Firestore
   * - Listens for answer SDP and ICE candidates from the peer
   */
  const createSession = async () => {
    setLoading(true);
    setError("");
    try {
      setMode('send');
      // Close previous connection if any
      if (pc.current) {
  try { pc.current.close(); } catch {/* intentionally empty */}
        pc.current = null;
      }
      const newPeerConnection = new RTCPeerConnection(servers);
      pc.current = newPeerConnection;
      // Robust error handling for WebRTC events
      let reconnectAttempts = 0;
      newPeerConnection.oniceconnectionstatechange = () => {
        if (["failed", "disconnected"].includes(newPeerConnection.iceConnectionState)) {
          setError("⚠️ Connection lost. Attempting to reconnect...");
          if (reconnectAttempts < 3) {
            reconnectAttempts++;
            // Try to restart ICE
            try {
              newPeerConnection.restartIce();
            } catch {/* intentionally empty */}
          } else {
            setError("❌ Connection failed after multiple attempts. Please refresh and start a new session.");
          }
        } else if (newPeerConnection.iceConnectionState === "closed") {
          setError("❌ Connection closed. Please refresh and start a new session.");
        }
      };
      // Create a data channel for file transfer
      const sendChannel = newPeerConnection.createDataChannel("sendChannel");
      handleDataChannel(sendChannel);

      // Generate a short random session code (6 alphanumeric chars)
      const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      setSessionCode(shortCode);

      // Use the short code as the Firestore doc ID
      const sessionRef = doc(db, "sessions", shortCode);
      await setDoc(sessionRef, { createdAt: serverTimestamp() });

      // Subcollections for ICE candidates
      const offerCandidatesCol = collection(db, "sessions", shortCode, "offerCandidates");
      const answerCandidatesCol = collection(db, "sessions", shortCode, "answerCandidates");

      // When ICE candidate is found, add to Firestore
  newPeerConnection.onicecandidate = async (event) => {
        try {
          if (event.candidate) {
            await addDoc(offerCandidatesCol, event.candidate.toJSON());
          }
        } catch {
          setError("Failed to send ICE candidate. Check your network.");
        }
      };

      // Create and set local SDP offer
      let offerDescription;
      try {
        offerDescription = await newPeerConnection.createOffer();
        await newPeerConnection.setLocalDescription(offerDescription);
      } catch {
        setError("Failed to create offer. Please refresh and try again.");
        return;
      }

      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
      };

      await updateDoc(sessionRef, { offer });

      // Listen for answer SDP from peer
      onSnapshot(sessionRef, (snapshot) => {
        const data = snapshot.data();
        if (data?.answer && newPeerConnection.signalingState === "have-local-offer" && !newPeerConnection.currentRemoteDescription) {
          if (!newPeerConnection.remoteDescription || newPeerConnection.remoteDescription.type !== "answer") {
            try {
              const answerDescription = new RTCSessionDescription(data.answer);
              newPeerConnection.setRemoteDescription(answerDescription);
            } catch {
              setError("Failed to set remote description.");
            }
          }
        }
      }, { includeMetadataChanges: true });

      // Listen for answer ICE candidates from peer
      onSnapshot(answerCandidatesCol, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            try {
              const candidate = new RTCIceCandidate(change.doc.data());
              // Prevent duplicate ICE candidates
              if (!newPeerConnection.remoteDescription || newPeerConnection.signalingState !== "closed") {
                newPeerConnection.addIceCandidate(candidate).catch(() => {});
              }
            } catch {
              setError("Failed to add ICE candidate.");
            }
          }
        });
      }, { includeMetadataChanges: true });

  // setPeerConnection removed (no longer defined)
    } catch {
      setError("Failed to create session. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * joinSession
   * Peer joins an existing session using a 6-char code.
   * - Reads offer SDP from Firestore, sets as remote description
   * - Creates answer SDP, writes to Firestore
   * - Listens for ICE candidates from host and adds own
   */
  const joinSession = async () => {
    setLoading(true);
    setError("");
    try {
      // Close previous connection if any
      if (pc.current) {
  try { pc.current.close(); } catch {/* intentionally empty */}
        pc.current = null;
      }
      const sessionId = sessionCode;
      const sessionRef = doc(db, "sessions", sessionId);
      const offerCandidatesCol = collection(db, "sessions", sessionId, "offerCandidates");
      const answerCandidatesCol = collection(db, "sessions", sessionId, "answerCandidates");

      const newPeerConnection = new RTCPeerConnection(servers);
      pc.current = newPeerConnection;
      let reconnectAttempts = 0;
      newPeerConnection.oniceconnectionstatechange = () => {
        if (["failed", "disconnected"].includes(newPeerConnection.iceConnectionState)) {
          setError("⚠️ Connection lost. Attempting to reconnect...");
          if (reconnectAttempts < 3) {
            reconnectAttempts++;
            try {
              newPeerConnection.restartIce();
            } catch {/* intentionally empty */}
          } else {
            setError("❌ Connection failed after multiple attempts. Please refresh and start a new session.");
          }
        } else if (newPeerConnection.iceConnectionState === "closed") {
          setError("❌ Connection closed. Please refresh and start a new session.");
        }
      };

      // Add ICE candidates to Firestore as they are found
      newPeerConnection.onicecandidate = async (event) => {
        try {
          if (event.candidate) {
            await addDoc(answerCandidatesCol, event.candidate.toJSON());
          }
        } catch {
          setError("Failed to send ICE candidate. Check your network.");
        }
      };

      // Listen for data channel from host
  newPeerConnection.ondatachannel = (event) => {
        handleDataChannel(event.channel);
      };

      // Get offer SDP from Firestore
      const sessionDoc = await getDoc(sessionRef);
      if (!sessionDoc.exists()) {
        setError("Session not found! Check the code and try again.");
        setLoading(false);
        return;
      }

      try {
        const offerDescription = sessionDoc.data().offer;
        await newPeerConnection.setRemoteDescription(new RTCSessionDescription(offerDescription));
      } catch {
        setError("Failed to set remote description.");
        setLoading(false);
        return;
      }

      // Create and set local answer SDP
      let answerDescription;
      try {
        answerDescription = await newPeerConnection.createAnswer();
        await newPeerConnection.setLocalDescription(answerDescription);
      } catch {
        setError("Failed to create answer.");
        setLoading(false);
        return;
      }

      const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
      };

      await updateDoc(sessionRef, { answer });

      // Listen for offer ICE candidates from host
      onSnapshot(offerCandidatesCol, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            try {
              const candidate = new RTCIceCandidate(change.doc.data());
              // Prevent duplicate ICE candidates
              if (!newPeerConnection.remoteDescription || newPeerConnection.signalingState !== "closed") {
                newPeerConnection.addIceCandidate(candidate).catch(() => {});
              }
            } catch {
              setError("Failed to add ICE candidate.");
            }
          }
        });
      }, { includeMetadataChanges: true });

  // setPeerConnection removed (no longer defined)
    } catch {
      setError("Failed to join session. Please check the code and your network connection.");
    } finally {
      setLoading(false);
    }
  };
// Clean up peer connection on unmount
  useEffect(() => {
    return () => {
      if (pc.current) {
  try { pc.current.close(); } catch {/* intentionally empty */}
        pc.current = null;
      }
    };
  }, []);
  
  /**
   * handleDataChannel
   * Sets up handlers for the WebRTC data channel for file transfer.
   * - onopen: update UI to connected
   * - onmessage: handles file metadata and chunked file transfer
   * - onclose: updates status
   */
  const handleDataChannel = (channel) => {
    channel.onopen = () => {
      setMode('connected');
      setStep(2);
      setTransferStatus('Connection established. Ready to transfer.');
    };
    channel.onclose = () => {
      setTransferStatus('Connection closed.');
      // Clean up session data in Firestore
      if (sessionCode) deleteSessionFromFirestore(sessionCode);
    };
  channel.onmessage = (event) => {
      // --- File receive logic ---
      // If message is metadata, initialize receive state
      if (typeof event.data === 'string' && event.data.startsWith('META:')) {
        // Metadata message
        const meta = JSON.parse(event.data.slice(5));
        setReceivedMeta(meta);
        receivedMetaRef.current = meta;
  // setReceivedChunks removed
    setTransferStatus(`Receiving file ${currentFileIndex + 1} of ${filesToSend.length}...`);
  setProgress(0);
  setBytesTransferred(0);
  setTransferStartTime(Date.now());
  setShowDownload(false);
  // setReceivedFile removed (no longer defined)
      } else if (event.data instanceof ArrayBuffer) {
        // TODO: Implement ArrayBuffer handling logic here if needed
        // Empty block intentionally left for future logic
      }
    };
    setDataChannel(channel);
  };


  /**
   * useEffect: Send file when selected
   * - Sends file metadata first
   * - Reads file in 16KB chunks and sends over data channel
   * - Updates progress and resets state after sending
   */
  // Multi-file send logic with history
  useEffect(() => {
    if (filesToSend.length > 0 && dataChannel && dataChannel.readyState === 'open') {
      const file = filesToSend[currentFileIndex];
      if (!file) return;
      setTransferStatus(`Sending file ${currentFileIndex + 1} of ${filesToSend.length}...`);
      // Dynamic chunk size based on device memory
      let chunkSize = 64 * 1024; // Default 64KB for speed
      if (navigator.deviceMemory && navigator.deviceMemory < 2) chunkSize = 16 * 1024; // Safer for low-memory
      if (file.size > 100 * 1024 * 1024) chunkSize = 128 * 1024; // Larger for big files
      let offset = 0;
      // Flow control: pause sending if buffer is too high
      const MAX_BUFFERED_AMOUNT = 2 * 1024 * 1024; // 2MB
      if (dataChannel.bufferedAmountLowThreshold === 0) {
        dataChannel.bufferedAmountLowThreshold = 512 * 1024; // 512KB
      }
      let paused = false;
  // Send metadata first
  dataChannel.send('META:' + JSON.stringify({ name: file.name, size: file.size, type: file.type }));
  setTransferStartTime(Date.now());
  setBytesTransferred(0);
      const reader = new FileReader();
      // For resumable transfer, track offset and allow resume (future)
      const readSlice = () => {
        if (paused) return;
        const slice = file.slice(offset, offset + chunkSize);
        reader.readAsArrayBuffer(slice);
      };
  reader.onload = (e) => {
        if (e.target.result) {
          // Flow control: pause if buffer is too high
          if (dataChannel.bufferedAmount > MAX_BUFFERED_AMOUNT) {
            paused = true;
            dataChannel.onbufferedamountlow = () => {
              paused = false;
              dataChannel.onbufferedamountlow = null;
              readSlice();
            };
            return;
          }
          dataChannel.send(e.target.result);
          offset += e.target.result.byteLength;
          const percent = Math.floor((offset / file.size) * 100);
          setProgress(percent);
          setBytesTransferred(offset);
          setPerFileProgress(prev => {
            const arr = [...prev];
            arr[currentFileIndex] = percent;
            return arr;
          });
          if (offset < file.size) {
            readSlice(); // Immediate, no delay
          } else {
            setTransferStatus(`File sent: ${file.name}`);
            setProgress(100);
            setPerFileProgress(prev => {
              const arr = [...prev];
              arr[currentFileIndex] = 100;
              return arr;
            });
            setLastSentFile({ name: file.name, size: file.size });
            // Add to history
            addHistory({
              direction: 'sent',
              name: file.name,
              size: file.size,
              type: file.type,
              date: Date.now(),
            });
            // Add to current session files
            setCurrentSessionFiles(prev => [
              { direction: 'sent', name: file.name, size: file.size, type: file.type, date: Date.now() },
              ...prev
            ]);
            // Next file after short delay
            setTimeout(() => {
              if (currentFileIndex + 1 < filesToSend.length) {
                setCurrentFileIndex(i => i + 1);
              } else {
                setFilesToSend([]);
                setCurrentFileIndex(0);
                setProgress(0);
                setPerFileProgress([]);
              }
            }, 800);
          }
        }
      };
      readSlice();
    }
  }, [filesToSend, dataChannel, currentFileIndex]);

  // --- Modern UI Layout ---
  return (
    <>
  <ChidoriEffect />
      <div className={`app-container theme-${theme}`} style={{position:'relative',zIndex:1}}> 
    <ConstellationBackground />
      <header className="neo-header-minimal">
        <div style={{position:'absolute',top:18,right:18,display:'flex',alignItems:'center',gap:'0.7em'}}>
          <a href="https://github.com/Px-JebaSeelan/Neo-Sharex" target="_blank" rel="noopener" aria-label="GitHub" className="neo-header-icon-link">
            <span className="neo-header-icon-bg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.49 2.87 8.3 6.84 9.64.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.1-1.5-1.1-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05A9.38 9.38 0 0 1 12 6.84c.85.004 1.71.12 2.51.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.58.69.48A10.01 10.01 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" fill="#fff"/>
              </svg>
            </span>
          </a>
          <a href="https://www.linkedin.com/in/jeba-seelan-598868324/" target="_blank" rel="noopener" aria-label="LinkedIn" className="neo-header-icon-link">
            <span className="neo-header-icon-bg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm13.5 10.28h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.39v4.58h-3v-9h2.89v1.23h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v4.72z" fill="#fff"/>
              </svg>
            </span>
          </a>
          {/* Email icon with popup */}
          <button
            className="neo-header-icon-link"
            style={{background:'none',border:'none',cursor:'pointer',padding:0}}
            aria-label="Email"
            onClick={() => setShowEmailPopup(v => !v)}
          >
            <span className="neo-header-icon-bg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="12" fill="none"/>
                <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Zm1.6.4 6.4 5.1 6.4-5.1A1 1 0 0 0 17.5 7h-11a1 1 0 0 0-.9.9Zm14 1.2-6.7 5.3a1 1 0 0 1-1.2 0L5 9.1V16.5A1.5 1.5 0 0 0 6.5 18h11a1.5 1.5 0 0 0 1.5-1.5V9.1Z" fill="#fff"/>
              </svg>
            </span>
          </button>
          {showEmailPopup && (
            <div className="neo-header-email-popup-overlay" onClick={() => setShowEmailPopup(false)}>
              <div className="neo-header-email-popup" onClick={e => e.stopPropagation()}>
                <div className="neo-header-email-popup-inner">
                  <button className="neo-header-email-btn" onClick={() => handleCopyEmail('packiyajebaseelan@gmail.com')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Zm1.6.4 6.4 5.1 6.4-5.1A1 1 0 0 0 17.5 7h-11a1 1 0 0 0-.9.9Zm14 1.2-6.7 5.3a1 1 0 0 1-1.2 0L5 9.1V16.5A1.5 1.5 0 0 0 6.5 18h11a1.5 1.5 0 0 0 1.5-1.5V9.1Z" fill="#fff"/></svg>
                    <span>Developer Email</span>
                    <span className="neo-header-email-address">packiyajebaseelan@gmail.com</span>
                    {copiedEmail === 'packiyajebaseelan@gmail.com' && <span className="neo-header-email-copied">Copied!</span>}
                  </button>
                  <button className="neo-header-email-btn" onClick={() => handleCopyEmail('neosharexofc@gmail.com')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Zm1.6.4 6.4 5.1 6.4-5.1A1 1 0 0 0 17.5 7h-11a1 1 0 0 0-.9.9Zm14 1.2-6.7 5.3a1 1 0 0 1-1.2 0L5 9.1V16.5A1.5 1.5 0 0 0 6.5 18h11a1.5 1.5 0 0 0 1.5-1.5V9.1Z" fill="#fff"/></svg>
                    <span>Team NeoShare Email</span>
                    <span className="neo-header-email-address">neosharexofc@gmail.com</span>
                    {copiedEmail === 'neosharexofc@gmail.com' && <span className="neo-header-email-copied">Copied!</span>}
                  </button>
                </div>
              </div>
            </div>
          )}
          <button
            className="btn btn-secondary"
            style={{padding:'0.5em 1em',fontWeight:500,fontSize:'1.05em'}}
            onClick={() => setShowHistoryModal(true)}
          >
            <span role="img" aria-label="history" style={{marginRight:'0.5em'}}>🕑</span>History
          </button>
        </div>
        <div className="neo-header-minimal-row">
          <motion.span
            className="neo-header-minimal-title neo-header-gradient-title"
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, type: 'spring' }}
          >
            <svg
              className="neo-header-title-icon"
              width="28" height="28" viewBox="0 0 44 44"
              fill="none"
              style={{verticalAlign:'-6px',marginRight:'0.5rem'}}
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="22" cy="22" r="22" fill="url(#paint0_linear)"/>
              <motion.circle
                cx={22 + ballPos.x * 12}
                cy={23.5 + ballPos.y * 12}
                r="6.5"
                fill="#fff"
                animate={{
                  cx: 22 + ballPos.x * 12,
                  cy: 23.5 + ballPos.y * 12
                }}
                transition={{ type: 'tween', ease: 'linear', duration: 0.01 }}
              />
              <defs>
                <linearGradient id="paint0_linear" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00e5ff"/>
                  <stop offset="1" stopColor="#23234a"/>
                </linearGradient>
              </defs>
            </svg>
            Neo<span className="neo-header-gradient-accent">Sharex</span>
          </motion.span>
        </div>
      </header>
      <Fab icon={<span style={{fontSize:'1.5rem'}}>?</span>} label="Help" onClick={() => setShowModal(true)} />
  <Stepper className="neo-stepper" steps={["Home", "Session", "Connected", "Transfer"]} activeStep={step} />
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          className="action-panel"
          variants={{hidden:{opacity:0,scale:0.95},visible:{opacity:1,scale:1},exit:{opacity:0,scale:0.95}}}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          {mode === 'home' && (
            <div className="action-buttons-container" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'1.2rem',marginBottom:'1.2rem'}}>
              <div className="action-buttons-info" style={{fontSize:'1.13rem',color:'var(--color-text-dark)',fontWeight:500,marginBottom:'0.5rem',textAlign:'center',maxWidth:'420px',lineHeight:1.5}}>
                <span className="action-info-text">
                  Welcome to <b>Neo Sharex</b>!<br/>
                  <span className="action-info-desktop">No sign up. No hassle. 100% peer-to-peer.</span>
                  <span className="action-info-mobile">No sign up. No hassle.<br/>100% peer-to-peer.</span>
                </span>
              </div>
              <div className="action-buttons" style={{display:'flex',gap:'1.5rem',justifyContent:'center'}}>
                <Tooltip text="Start a new file sharing session">
                  <button className="btn btn-primary" aria-label="Start a new file sharing session" onClick={async()=>{await createSession();setStep(1);}} disabled={loading}>
                    {loading ? 'Loading...' : 'Send'}
                  </button>
                </Tooltip>
                <Tooltip text="Join a session to receive files">
                  <button className="btn btn-primary" aria-label="Join a session to receive files" onClick={()=>{setMode('receive');setStep(1);}} disabled={loading}>
                    Receive
                  </button>
                </Tooltip>
              </div>
            </div>
          )}
          {mode === 'send' && (
            <div>
              <h2 style={{marginBottom:0, color:'#00e5ff', textShadow:'0 2px 12px #101c3a'}}>Your Session</h2>
              <p className="info-text">Share this code or scan the QR code to connect.</p>
              <div className="neo-card" style={{textAlign:'center'}}>
                <div className="session-code-display session-code-display-has-btn">
                  <span>{sessionCode}</span>
                  <button
                    className="session-code-copy-btn"
                    title="Copy code"
                    onClick={() => {navigator.clipboard.writeText(sessionCode); setToast('Code copied!')}}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="7" y="7" width="10" height="14" rx="3" fill="#101c3a" stroke="#00e5ff" strokeWidth="1.5"/>
                      <rect x="3" y="3" width="10" height="14" rx="3" fill="#181f3a" stroke="#00e5ff99" strokeWidth="1.5"/>
                    </svg>
                  </button>
                </div>
                <button className="btn btn-secondary" aria-label="Show or hide QR code" style={{marginBottom: '1rem'}} onClick={() => setShowQR((v) => !v)}>
                  {showQR ? 'Hide QR' : 'Show QR Code'}
                </button>
                {showQR && (
                  <div className="neo-qr-card">
                    <div className="neo-qr-label">Scan to Join</div>
                    <div className="neo-qr-code-wrap">
                      <QRCodeCanvas
                        value={`${window.location.origin}/?code=${sessionCode}`}
                        size={180}
                        bgColor="#101c3a"
                        fgColor="#00e5ff"
                        style={{borderRadius:'18px'}}
                      />
                    </div>
                  </div>
                )}
              </div>
              {loading && <div style={{color:'#00e5ff',margin:'1rem',fontWeight:500,fontSize:'1.1em',background:'#e0f7fa',border:'1px solid #00e5ff33',borderRadius:'8px',padding:'0.7em 1em',boxShadow:'0 2px 8px #00e5ff22'}}>Setting up session...</div>}
              {error && <div style={{color:'#b71c1c', margin:'1rem',fontWeight:600,fontSize:'1.1em',background:'#fff3f3',border:'1px solid #ffbdbd',borderRadius:'8px',padding:'0.7em 1em',boxShadow:'0 2px 8px #ffbdbd33'}}>{error}</div>}
              <p className="info-text">Waiting for connection...</p>
            </div>
          )}
          {mode === 'receive' && (
            <div className="input-section">
              <div className="session-input-label">Enter the code provided by the sender</div>
              <div className="session-input-container-pro">
                <input
                  type="text"
                  id="sessionCodeInput"
                  name="sessionCode"
                  placeholder="Enter Code..."
                  className="session-input session-input-pro"
                  value={sessionCode}
                  onChange={(_e) => setSessionCode(_e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  maxLength={6}
                  autoCapitalize="characters"
                  disabled={loading}
                />
              </div>
              <button className="btn btn-primary session-input-btn-pro" aria-label="Connect to session" onClick={async()=>{await joinSession();setStep(2);}} disabled={sessionCode.length !== 6 || loading}>
                {loading ? 'Connecting...' : 'Connect'}
              </button>
              {error && <div style={{color:'#b71c1c', margin:'1rem',fontWeight:600,fontSize:'1.1em',background:'#fff3f3',border:'1px solid #ffbdbd',borderRadius:'8px',padding:'0.7em 1em',boxShadow:'0 2px 8px #ffbdbd33'}}>{error}</div>}
              <p className="info-text">Or scan the QR code from sender's device.</p>
            </div>
          )}
          {mode === 'connected' && (
            <div>
              <h2 style={{
                color: 'var(--color-primary)',
                textShadow: '0 2px 12px #00e5ff44, 0 1px 0 #23234a',
                fontWeight: 800,
                letterSpacing: '0.01em',
                marginBottom: '0.7em',
                marginTop: '0.2em',
                fontSize: '1.35em',
              }}>Connected!</h2>
              <FileDropzone onFilesAccepted={handleFilesAccepted} />
              {lastSentFile && (
                <div style={{
                  margin: '1em 0 0.5em 0',
                  padding: '0.7em 1.2em',
                  background: 'rgba(0,229,255,0.08)',
                  border: '1px solid #00e5ff33',
                  borderRadius: '8px',
                  color: '#00bfff',
                  fontWeight: 600,
                  fontSize: '1.08em',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px #00e5ff11',
                  maxWidth: '420px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}>
                  Sent: <span style={{color:'#00e5ff'}}>{lastSentFile.name}</span> <span style={{color:'#b2ebf2',fontWeight:400}}>({Math.round(lastSentFile.size/1024)} KB)</span>
                </div>
              )}
              {filesToSend.length > 0 && (
                <div style={{maxHeight:'320px',overflowY:'auto',marginTop:'1.2em',marginBottom:'1.2em',borderRadius:'12px',background:'rgba(0,229,255,0.04)',boxShadow:'0 2px 12px #00e5ff11'}}>
                  {filesToSend.map((file, idx) => (
                    <div
                      key={file.name + file.size + idx}
                    >
                      <TransferProgress
                        file={file}
                        progress={perFileProgress[idx] || 0}
                        status={
                          idx < currentFileIndex
                            ? <span style={{color:'#43a047',fontWeight:600}}>Sent</span>
                            : idx === currentFileIndex
                              ? <span style={{color:'#00bfff',fontWeight:600}}>{transferStatus}</span>
                              : <span style={{color:'#888'}}>Queued</span>
                        }
                        highlight={idx === currentFileIndex}
                        bytesTransferred={idx === currentFileIndex ? bytesTransferred : undefined}
                        startTime={idx === currentFileIndex ? transferStartTime : undefined}
                      />
                    </div>
                  ))}
                </div>
              )}
              {/* Current Session Files List */}
              {currentSessionFiles.length > 0 && (
                <div className="current-session-files-container" style={{ textAlign: 'center' }}>
                  <h3 style={{color:'#00bfff',marginBottom:'0.7em'}}>Current Session Files</h3>
                  {/* Download All Button for received files */}
                  {currentSessionFiles.some(f => f.direction === 'received') && (
                    <button
                      className="btn btn-primary"
                      style={{marginBottom:'1em'}}
                      onClick={async () => {
                        const JSZip = (await import('jszip')).default;
                        const zip = new JSZip();
                        const receivedFiles = currentSessionFiles.filter(f => f.direction === 'received');
                        for (const file of receivedFiles) {
                          const response = await fetch(file.url);
                          const blob = await response.blob();
                          zip.file(file.name, blob);
                        }
                        const content = await zip.generateAsync({ type: 'blob' });
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(content);
                        a.download = 'neo-sharex-files.zip';
                        a.click();
                        setToast('All files zipped and downloading!');
                      }}
                    >
                      Download All
                    </button>
                  )}
                  <div style={{maxHeight:'260px',overflowY:'auto',marginBottom:'1em', width:'100%'}}>
                    {currentSessionFiles.map((file, idx) => (
                      <SessionFileCard key={file.name + file.size + file.direction + idx} file={file} />
                    ))}
                  </div>
                </div>
              )}
              {receivedMeta && !showDownload && (
                <div style={{marginTop:'2em', maxWidth:'420px', marginLeft:'auto', marginRight:'auto', background:'linear-gradient(135deg, #101c3a 80%, #00e5ff22 100%)', borderRadius:'14px', boxShadow:'0 2px 12px #00e5ff22', padding:'1em 1em 1.2em 1em', color:'#e0f7fa', textAlign:'center'}}>
                  <div style={{margin:'0.3em 0', fontSize:'1.05em'}}>
                    <strong style={{color:'#00e5ff'}}>Name:</strong> <span style={{color:'#fff'}}>{receivedMeta?.name}</span><br />
                    <strong style={{color:'#00e5ff'}}>Size:</strong> <span style={{color:'#b2ebf2'}}>{Math.round(receivedMeta?.size / 1024)} KB</span>
                  </div>
                  <TransferProgress 
                    file={receivedMeta} 
                    progress={progress} 
                    status={<span style={{color:'#00e5ff',fontWeight:600}}>{`Receiving file ${currentFileIndex + 1} of ${filesToSend.length}...`}</span>} 
                    bytesTransferred={bytesTransferred}
                    startTime={transferStartTime}
                  />
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <Notification message={toast} onClose={() => setToast("")} />
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <h2>How to use Neo Sharex</h2>
        <ol style={{textAlign:'left',margin:'1rem 0'}}>
          <li>Click <b>Send</b> to start a new session, or <b>Receive</b> to join one.</li>
          <li>Share the session code or QR code with your peer.</li>
          <li>Drop a file to send, or download when received.</li>
        </ol>
        <p style={{color:'#00e5ff'}}>All transfers are peer-to-peer and private.</p>
      </Modal>
      {/* Transfer History Modal */}
      <Modal open={showHistoryModal} onClose={() => setShowHistoryModal(false)}>
        <h2 style={{marginTop:0}}>Transfer History</h2>
        <TransferHistory history={history} onClear={clearHistory} />
      </Modal>
    {/* Minimal Professional Credits Footer */}
    <footer className="neo-footer-credits">
      Developed with <span role="img" aria-label="blue heart" style={{color:'#00bfff',fontSize:'1.1em',verticalAlign:'-2px'}}>💙</span> by Jeba Seelan
    </footer>
      </div>
    </>
  );
}

// --- Session File Card Component ---
function SessionFileCard({ file }) {
  const [showPreview, setShowPreview] = useState(false);
  return (
  <div className="neo-session-file-card">
      <div style={{fontWeight:600,color:'#00e5ff',fontSize:'1.08em',marginBottom:'0.2em'}}>
        {file.direction === 'sent' ? 'File sent' : 'File received'}
      </div>
      <div style={{margin:'0.3em 0',fontSize:'1.05em'}}>
        <strong style={{color:'#00e5ff'}}>Name:</strong> <span style={{color:'#fff'}}>{file.name}</span><br />
        <strong style={{color:'#00e5ff'}}>Size:</strong> <span style={{color:'#b2ebf2'}}>{Math.round(file.size / 1024)} KB</span>
      </div>
      <div style={{marginTop:'0.5em',display:'flex',gap:'0.7em',flexWrap:'wrap'}}>
        {file.direction === 'received' && file.url && (
          <>
            <button className="btn btn-secondary" aria-label={showPreview ? 'Hide file preview' : 'Show file preview'} onClick={() => setShowPreview(v => !v)}>
              {showPreview ? 'Hide Preview' : 'Preview'}
            </button>
            <button className="btn btn-primary" aria-label="Download received file" onClick={() => {
              const a = document.createElement('a');
              a.href = file.url;
              a.download = file.name;
              a.click();
            }}>Download</button>
            <button className="btn btn-secondary" aria-label="Copy download link" onClick={async () => {
              try {
                await navigator.clipboard.writeText(file.url);
              } catch {/* intentionally empty for clipboard errors */}
            }}>Copy Download Link</button>
          </>
        )}
      </div>
      {showPreview && file.direction === 'received' && file.url && (
        <div style={{marginTop:'1em'}}>
          <FilePreview file={file} url={file.url} />
        </div>
      )}
    </div>
  );
}

export default App;