# Neo Sharex Architecture

## Overview
Neo Sharex is a modern, privacy-first, peer-to-peer file transfer app built with React, Vite, and Firebase. It uses WebRTC for direct, encrypted file transfers between devices, with Firebase Firestore as a signaling server (no files or user data are stored on any server).

## Key Components
- **Frontend:** React 19, Vite, Framer Motion, modern CSS
- **Signaling:** Firebase Firestore (for session/ICE exchange only)
- **Transfer:** WebRTC DataChannel (end-to-end, direct, encrypted)
- **No files or user data stored on any server**

## Data Flow
1. **Session Creation:**
   - Sender creates a session, which writes a session document to Firestore.
   - A unique session code (and QR) is generated for the receiver.
2. **Signaling:**
   - Both peers exchange WebRTC offer/answer and ICE candidates via Firestore.
   - Once the connection is established, signaling data is deleted.
3. **File Transfer:**
   - Files are sent directly over a WebRTC DataChannel (peer-to-peer, encrypted).
   - Progress, speed, and ETA are shown in real time.
4. **Session Cleanup:**
   - When a session ends, all session data is deleted from Firestore.

## Main Files
- `src/App.jsx`: Main app logic, session management, UI state, and routing.
- `src/components/`: UI components (file dropzone, progress, modals, etc.)
- `src/firebase.js`: Firebase config and initialization (uses environment variables).

## Security
- All transfers are end-to-end encrypted.
- No files or user data are ever stored on a server.
- Only session metadata and signaling info are temporarily stored in Firebase and deleted after use.

## Extending
- Add new file preview types by extending `FilePreview`.
- Add new UI features by creating new components in `src/components/`.
- For advanced customization, see the code comments in `App.jsx` and `TransferProgress.jsx`.

---

For more, see the README and code comments throughout the project.
