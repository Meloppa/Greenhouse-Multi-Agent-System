import React, { useState, useRef } from 'react';
import { UploadCloud, Sparkles, Activity, ShieldCheck, Bug, HelpCircle } from 'lucide-react';

export default function Diagnostics({ onDiagnose, history }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setReport(null);
  };

  const triggerScan = async () => {
    if (!selectedFile) return;
    
    setScanning(true);
    
    // Premium timing animation to mimic the AI Diagnostics Agent in progress
    setTimeout(async () => {
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        
        const res = await onDiagnose(formData);
        setReport(res);
      } catch (err) {
        console.error("Diagnosis error:", err);
      } finally {
        setScanning(false);
      }
    }, 2400);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setReport(null);
    setScanning(false);
  };

  const getStatusBadge = (status) => {
    if (status === 'Healthy') {
      return { label: 'HEALTHY', bg: '#ECFDF5', border: '#A7F3D0', color: '#047857', icon: ShieldCheck };
    }
    return { label: 'DISEASE DETECTED', bg: '#FEF2F2', border: '#FCA5A5', color: '#B91C1C', icon: Bug };
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>Diagnostics Center (Vision Agent)</h3>
        <span style={styles.subtitle}>Upload leaf photos to scan for plant diseases and pests</span>
      </div>

      <div style={styles.contentGrid}>
        {/* Upload Column */}
        <div style={styles.uploadCol}>
          {!previewUrl ? (
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                ...styles.dropZone,
                borderColor: dragActive ? '#7C3AED' : '#CBD5E1',
                backgroundColor: dragActive ? '#F5F3FF' : '#FFFFFF'
              }}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                onChange={handleChange}
                style={styles.fileInput}
                accept="image/*"
              />
              <div style={styles.dropWrapper}>
                <div style={styles.uploadIconCircle}>
                  <UploadCloud size={24} color="#7C3AED" />
                </div>
                <h4 style={styles.dropText}>Drag & drop leaf photo here</h4>
                <p style={styles.dropSubtext}>Supports JPG, PNG up to 10MB</p>
                <button style={styles.selectBtn}>Browse File</button>
              </div>
            </div>
          ) : (
            <div style={styles.previewContainer}>
              <img src={previewUrl} alt="Leaf Preview" style={styles.previewImage} />
              
              {/* Green active scanning laser effect */}
              {scanning && (
                <div style={styles.laserLine}></div>
              )}

              {scanning && (
                <div style={styles.scanningOverlay}>
                  <Activity size={32} color="#7C3AED" style={styles.spinner} />
                  <span style={styles.scanningText}>AI Vision Agent Scanning...</span>
                </div>
              )}

              {!scanning && !report && (
                <div style={styles.previewActions}>
                  <button onClick={triggerScan} style={styles.btnScan}>
                    <Sparkles size={14} />
                    <span>Run AI Diagnostics</span>
                  </button>
                  <button onClick={resetForm} style={styles.btnCancel}>Cancel</button>
                </div>
              )}

              {report && (
                <button onClick={resetForm} style={styles.btnReset}>Scan New Photo</button>
              )}
            </div>
          )}
        </div>

        {/* Diagnostic Results Report Column */}
        <div style={styles.reportCol}>
          {report ? (
            <div style={styles.reportWrapper}>
              {/* Header result badge */}
              {(() => {
                const conf = getStatusBadge(report.status);
                const Icon = conf.icon;
                return (
                  <div style={{
                    ...styles.statusHeader,
                    backgroundColor: conf.bg,
                    borderColor: conf.border
                  }}>
                    <Icon size={18} color={conf.color} />
                    <span style={{ ...styles.statusLabel, color: conf.color }}>
                      {conf.label} ({report.confidence}% Conf.)
                    </span>
                  </div>
                );
              })()}

              <h4 style={styles.reportTitle}>{report.diagnosis}</h4>
              
              <div style={styles.resultsList}>
                <div style={styles.resultItem}>
                  <span style={styles.resultLabel}>Detected Symptoms:</span>
                  <p style={styles.resultDesc}>{report.symptoms}</p>
                </div>
                
                <div style={styles.resultItem}>
                  <span style={styles.resultLabel}>Urgent Action:</span>
                  <p style={{ ...styles.resultDesc, color: '#B91C1C', fontWeight: '600' }}>
                    {report.urgent_action}
                  </p>
                </div>

                <div style={styles.resultItem}>
                  <span style={styles.resultLabel}>Organic Remediation (Recommended):</span>
                  <p style={styles.resultDesc}>{report.organic_treatment}</p>
                </div>

                <div style={styles.resultItem}>
                  <span style={styles.resultLabel}>Chemical Treatment:</span>
                  <p style={styles.resultDesc}>{report.chemical_treatment}</p>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.emptyReport}>
              <HelpCircle size={32} color="#94A3B8" />
              <h4 style={styles.emptyReportTitle}>Awaiting Leaf Analysis</h4>
              <p style={styles.emptyReportDesc}>
                Upload or drag a photo of your crop leaf on the left, then trigger the Diagnostics Agent to analyze pathogens.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.01)'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '20px'
  },
  title: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: "'Outfit', sans-serif"
  },
  subtitle: {
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: '500'
  },
  contentGrid: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap'
  },
  uploadCol: {
    flex: '1 1 300px',
    minHeight: '260px',
    display: 'flex'
  },
  reportCol: {
    flex: '1.2 1 320px',
    border: '1px solid #F1F5F9',
    borderRadius: '16px',
    padding: '20px',
    backgroundColor: '#FAFAFE',
    minHeight: '260px',
    display: 'flex'
  },
  dropZone: {
    width: '100%',
    border: '2px dashed #CBD5E1',
    borderRadius: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    transition: 'all 0.15s ease-in-out'
  },
  fileInput: {
    display: 'none'
  },
  dropWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '10px'
  },
  uploadIconCircle: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    backgroundColor: '#F5F3FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '6px',
    boxShadow: '0 4px 10px rgba(124, 58, 237, 0.04)'
  },
  dropText: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#334155'
  },
  dropSubtext: {
    fontSize: '11px',
    color: '#94A3B8'
  },
  selectBtn: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
    cursor: 'pointer',
    marginTop: '6px'
  },
  previewContainer: {
    position: 'relative',
    width: '100%',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid #E2E8F0',
    backgroundColor: '#000000',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '280px'
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain'
  },
  scanningOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    left: 0,
    top: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px'
  },
  scanningText: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#6D28D9'
  },
  spinner: {
    animation: 'spin 1.5s infinite linear'
  },
  laserLine: {
    position: 'absolute',
    left: 0,
    width: '100%',
    height: '3px',
    backgroundColor: '#10B981',
    boxShadow: '0 0 8px #10B981',
    animation: 'scanLaser 2s infinite ease-in-out',
    zIndex: 5
  },
  previewActions: {
    position: 'absolute',
    bottom: '16px',
    display: 'flex',
    gap: '8px',
    zIndex: 6
  },
  btnScan: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#7C3AED',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 16px',
    color: '#FFFFFF',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(129, 140, 248, 0.3)'
  },
  btnCancel: {
    backgroundColor: '#EF4444',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 16px',
    color: '#FFFFFF',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  btnReset: {
    position: 'absolute',
    bottom: '16px',
    backgroundColor: '#475569',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 16px',
    color: '#FFFFFF',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    zIndex: 6
  },
  reportWrapper: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    border: '1px solid',
    borderRadius: '10px',
    width: 'fit-content'
  },
  statusLabel: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.5px'
  },
  reportTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: "'Outfit', sans-serif"
  },
  resultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '6px'
  },
  resultItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  resultLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase'
  },
  resultDesc: {
    fontSize: '12px',
    color: '#475569',
    lineHeight: '1.4'
  },
  emptyReport: {
    margin: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '10px',
    maxWidth: '280px'
  },
  emptyReportTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#475569',
    fontFamily: "'Outfit', sans-serif"
  },
  emptyReportDesc: {
    fontSize: '11px',
    color: '#94A3B8',
    lineHeight: '1.4'
  }
};
