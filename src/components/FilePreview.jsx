import React, { useEffect, useState, Suspense } from 'react';
import mammoth from 'mammoth';
import { marked } from 'marked';


const textTypes = [
  'text/plain', 'text/markdown', 'text/csv', 'text/html', 'text/css', 'application/json', 'application/xml',
  'application/javascript', 'application/x-javascript', 'application/x-python-code', 'application/x-sh',
  'application/x-httpd-php', 'application/x-java-source', 'application/x-c', 'application/x-c++',
];

/**
 * FilePreview displays a preview of various file types (images, docs, markdown, zip, etc.).
 * @param {{ file: File, url: string }} props
 * @returns {JSX.Element}
 */
const FilePreview = React.memo(({ file, url }) => {
  // DOCX preview using mammoth.js
  const isDocx = file && (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  const [docxHtml, setDocxHtml] = useState(null);
  const [docxError, setDocxError] = useState(null);
  useEffect(() => {
    if (isDocx && url) {
      setDocxHtml(null);
      setDocxError(null);
      fetch(url)
        .then(res => res.arrayBuffer())
        .then(buffer => mammoth.convertToHtml({ arrayBuffer: buffer }))
        .then(result => setDocxHtml(result.value))
        .catch(() => setDocxError('Failed to preview DOCX file.'));
    }
  }, [isDocx, url]);
  const [textContent, setTextContent] = useState(null);
  const [csvRows, setCsvRows] = useState(null);
  const [mdHtml, setMdHtml] = useState(null);
  const [zipList, setZipList] = useState(null);

  useEffect(() => {
    if (!file || !url) return;
    if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
      fetch(url)
        .then(r => r.text())
        .then(md => setMdHtml(marked.parse(md)))
        .catch(() => setMdHtml('<em>Could not load preview.</em>'));
    } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      fetch(url)
        .then(r => r.text())
        .then(csv => {
          const rows = csv.split(/\r?\n/).map(line => line.split(','));
          setCsvRows(rows);
        })
        .catch(() => setCsvRows([['Could not load preview.']]));
    } else if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
      fetch(url)
        .then(r => r.arrayBuffer())
        .then(async buf => {
          const JSZip = (await import('jszip')).default;
          const zip = await JSZip.loadAsync(buf);
          setZipList(Object.keys(zip.files));
        })
        .catch(() => setZipList(['Could not load preview.']));
    } else if (file.type.startsWith('text/') || textTypes.includes(file.type)) {
      fetch(url)
        .then(r => r.text())
        .then(setTextContent)
        .catch(() => setTextContent('Could not load preview.'));
    }
  }, [file, url]);

  if (!file || !url) return <div style={{margin:'0.7em 0',color:'#888'}}>No preview available.</div>;
  if (file.type.startsWith('image/')) {
    return <img src={url} alt={file.name} style={{maxWidth:'100%',maxHeight:'220px',borderRadius:'8px',margin:'0.7em 0',boxShadow:'0 2px 8px #00e5ff22'}} />;
  }
  if (file.type.startsWith('audio/')) {
    return <audio controls src={url} style={{width:'100%',margin:'0.7em 0'}} />;
  }
  if (file.type.startsWith('video/')) {
    return <video controls src={url} style={{width:'100%',maxHeight:'220px',borderRadius:'8px',margin:'0.7em 0',background:'#000',boxShadow:'0 2px 8px #00e5ff22'}} />;
  }
    // PowerPoint preview: ppt, pptx
    const isPPT = file && (
      file.name.endsWith('.ppt') || file.name.endsWith('.pptx') ||
      file.type === 'application/vnd.ms-powerpoint' ||
      file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
    if (isDocx) {
      return (
        <div style={{width:'100%',maxHeight:'320px',overflow:'auto',margin:'0.7em 0',background:'#fff',borderRadius:'8px',padding:'1em'}}>
          {docxError && <div style={{color:'#b71c1c',fontWeight:600}}>{docxError}</div>}
          {!docxError && !docxHtml && <div style={{color:'#00e5ff'}}>Loading preview...</div>}
          {docxHtml && <div dangerouslySetInnerHTML={{ __html: docxHtml }} />}
        </div>
      );
    }
    if (isPPT || file.type === 'application/msword' || file.name.endsWith('.doc')) {
      // Use Microsoft Office Online Viewer for ppt, pptx, doc
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
      return (
        <div style={{width:'100%',maxHeight:'220px',overflow:'auto',margin:'0.7em 0'}}>
          <iframe
            src={officeViewerUrl}
            title={file.name}
            style={{width:'100%',height:'220px',border:'1px solid #eee',borderRadius:'8px',background:'#fff'}}
            allowFullScreen
          />
          <div style={{fontSize:'0.95em',color:'#00e5ff',marginTop:'0.3em'}}>Preview powered by Microsoft Office Online</div>
        </div>
      );
    }
  if (file.type === 'application/pdf') {
    // Lazy-load PDF preview
    const PDFFrame = React.lazy(() => Promise.resolve({
      default: (props) => <iframe {...props} />
    }));
    return (
      <Suspense fallback={<div style={{margin:'0.7em 0',color:'#888'}}>Loading PDF preview...</div>}>
        <PDFFrame
          src={url}
          title={file.name}
          style={{width:'100%',height:'220px',border:'1px solid #eee',borderRadius:'8px',margin:'0.7em 0',background:'#fff'}}
        />
      </Suspense>
    );
  }
  if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
    return (
      <div style={{width:'100%',maxHeight:'180px',overflow:'auto',background:'#f7fbfd',border:'1px solid #eee',borderRadius:'8px',margin:'0.7em 0',padding:'0.7em',fontSize:'1em',textAlign:'left'}}
        dangerouslySetInnerHTML={{ __html: mdHtml || 'Loading...' }} />
    );
  }
  if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
    return (
      <div style={{width:'100%',maxHeight:'180px',overflow:'auto',background:'#f7fbfd',border:'1px solid #eee',borderRadius:'8px',margin:'0.7em 0',padding:'0.7em',fontSize:'0.98em',textAlign:'left'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <tbody>
            {csvRows ? csvRows.map((row, i) => (
              <tr key={i}>{row.map((cell, j) => <td key={j} style={{border:'1px solid #ddd',padding:'2px 6px'}}>{cell}</td>)}</tr>
            )) : <tr><td>Loading...</td></tr>}
          </tbody>
        </table>
      </div>
    );
  }
  if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
    return (
      <div style={{width:'100%',maxHeight:'180px',overflow:'auto',background:'#f7fbfd',border:'1px solid #eee',borderRadius:'8px',margin:'0.7em 0',padding:'0.7em',fontSize:'0.98em',textAlign:'left'}}>
        <strong>ZIP Contents:</strong>
        <ul style={{margin:'0.5em 0 0 1em',padding:0}}>
          {zipList ? zipList.map((name, i) => <li key={i}>{name}</li>) : <li>Loading...</li>}
        </ul>
      </div>
    );
  }
  if (file.type.startsWith('text/') || textTypes.includes(file.type)) {
      return (
        <pre style={{
          width: '100%',
          maxHeight: '180px',
          overflow: 'auto',
          background: '#f7fbfd',
          border: '1px solid #eee',
          borderRadius: '8px',
          margin: '0.7em 0',
          padding: '0.7em',
          fontSize: '0.98em',
          fontFamily: 'monospace',
          textAlign: 'left',
          color: '#23234a', // dark text for readability
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {textContent === null ? 'Loading...' : textContent}
        </pre>
      );
  }
  return <div style={{margin:'0.7em 0',color:'#888'}}>No preview available for this file type.</div>;
});

export default FilePreview;
