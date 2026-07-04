import React, { useState, useRef } from 'react';
import {
  UploadCloud, Leaf, Activity, ShieldCheck, Bug, AlertTriangle,
  Droplet, Zap, RefreshCw, Eye, Calendar
} from 'lucide-react';

const CATEGORY_CONFIG = {
  'Disease':           { color: '#dc2626', bg: '#fee2e2', label: '🦠 Disease',          borderColor: 'rgba(220,38,38,0.25)' },
  'Pest':              { color: '#b45309', bg: '#fef3c7', label: '🐛 Pest Damage',       borderColor: 'rgba(180,83,9,0.25)' },
  'Nutrient Deficiency': { color: '#0369a1', bg: '#e0f2fe', label: '🧪 Nutrient Deficiency', borderColor: 'rgba(3,105,161,0.25)' },
  'Abiotic Stress':    { color: '#6b7280', bg: '#f3f4f6', label: '⚡ Abiotic Stress',   borderColor: 'rgba(107,114,128,0.25)' },
  'Healthy':           { color: '#4a7c20', bg: '#f4fae9', label: '✅ Healthy',            borderColor: 'rgba(74,124,32,0.25)' },
};

const SEVERITY_CONFIG = {
  'Critical': { color: '#dc2626', bg: '#fee2e2' },
  'High':     { color: '#ea580c', bg: '#fff7ed' },
  'Medium':   { color: '#d97706', bg: '#fef3c7' },
  'Low':      { color: '#65a30d', bg: '#f7fee7' },
  'None':     { color: '#4a7c20', bg: '#f4fae9' },
};

export default function Diagnostics({ onDiagnose, history }) {
  const [dragActive, setDragActive]   = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl]   = useState(null);
  const [scanning, setScanning]       = useState(false);
  const [report, setReport]           = useState(null);
  const fileInputRef                  = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const processFile = (file) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setReport(null);
  };

  const triggerScan = async () => {
    if (!selectedFile) return;
    setScanning(true);
    setTimeout(async () => {
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const res = await onDiagnose(formData);
        setReport(res);
      } catch (err) {
        console.error('Diagnosis error:', err);
      } finally {
        setScanning(false);
      }
    }, 1800);
  };

  const resetForm = () => {
    setSelectedFile(null); setPreviewUrl(null);
    setReport(null); setScanning(false);
  };

  const catCfg = report ? (CATEGORY_CONFIG[report.category] || CATEGORY_CONFIG['Disease']) : null;
  const sevCfg = report ? (SEVERITY_CONFIG[report.severity] || SEVERITY_CONFIG['Medium']) : null;
  const isHealthy = report?.status === 'Healthy';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Main panel: upload + results */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>

        {/* Upload column */}
        <div style={{ flex: '1 1 280px', minHeight: 280, display: 'flex' }}>
          {!previewUrl ? (
            <div
              onDragEnter={handleDrag} onDragOver={handleDrag}
              onDragLeave={handleDrag} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                border: `2px dashed ${dragActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: dragActive ? 'var(--color-primary-light)' : 'var(--color-bg-card)',
                transition: 'all 0.15s ease',
                padding: 20,
              }}>
              <input ref={fileInputRef} type="file" onChange={handleChange} style={{ display: 'none' }} accept="image/*" />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', border: '1px solid var(--color-primary-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UploadCloud size={22} color="var(--color-primary)" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-title)', marginBottom: 4 }}>Drop leaf photo here</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>JPG, PNG — up to 10MB</div>
                </div>
                <button style={{ padding: '7px 16px', backgroundColor: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: 7, fontSize: 12, fontWeight: 600, color: 'var(--color-text-body)', cursor: 'pointer' }}>
                  Browse File
                </button>
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-border)', backgroundColor: '#000', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 280 }}>
              <img src={previewUrl} alt="Leaf preview" style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain' }} />

              {/* Laser scan line */}
              {scanning && (
                <div style={{ position: 'absolute', left: 0, width: '100%', height: 2, backgroundColor: 'var(--color-primary)', boxShadow: '0 0 8px var(--color-primary)', animation: 'scanLaser 1.8s infinite ease-in-out', zIndex: 5 }} />
              )}

              {scanning && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <Activity size={28} color="var(--color-primary)" style={{ animation: 'spin 1.5s linear infinite' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>qwen3-vl:4b scanning…</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>Analyzing disease, pests & nutrient levels</span>
                </div>
              )}

              {!scanning && !report && (
                <div style={{ position: 'absolute', bottom: 12, display: 'flex', gap: 8, zIndex: 6 }}>
                  <button onClick={triggerScan} style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'var(--color-primary)', border: 'none', borderRadius: 8, padding: '9px 16px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <Eye size={13} /> Run Diagnostics
                  </button>
                  <button onClick={resetForm} style={{ backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '9px 14px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
              )}

              {report && (
                <button onClick={resetForm} style={{ position: 'absolute', bottom: 12, backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '9px 14px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', zIndex: 6 }}>
                  <RefreshCw size={12} style={{ display: 'inline', marginRight: 5 }} />New Scan
                </button>
              )}
            </div>
          )}
        </div>

        {/* Report column */}
        <div style={{ flex: '1.2 1 300px', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18, backgroundColor: 'var(--color-bg-card)', minHeight: 280, display: 'flex', flexDirection: 'column' }}>
          {report ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>

              {/* Status banner */}
              <div style={{ padding: '10px 14px', borderRadius: 9, backgroundColor: catCfg.bg, border: `1px solid ${catCfg.borderColor}`, display: 'flex', alignItems: 'center', gap: 9 }}>
                {isHealthy ? <ShieldCheck size={18} color={catCfg.color} /> : <Bug size={18} color={catCfg.color} />}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: catCfg.color }}>{catCfg.label}</div>
                  {report.confidence && <div style={{ fontSize: 11, color: catCfg.color, opacity: 0.7 }}>{report.confidence}% confidence</div>}
                </div>
                {report.severity && report.severity !== 'None' && (
                  <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: sevCfg.color, backgroundColor: sevCfg.bg, padding: '3px 8px', borderRadius: 20 }}>
                    {report.severity}
                  </span>
                )}
              </div>

              {/* Diagnosis name */}
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-title)', letterSpacing: '-0.01em' }}>{report.diagnosis}</div>
                {report.affected_area_pct !== undefined && !isHealthy && (
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3 }}>
                    ~{report.affected_area_pct}% leaf area affected
                    {report.recovery_days && <> · Est. recovery: {report.recovery_days} days</>}
                  </div>
                )}
              </div>

              {/* Data rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
                {[
                  { label: 'Symptoms observed', val: report.symptoms, show: !!report.symptoms },
                  { label: '⚡ Urgent action', val: report.urgent_action, urgent: true, show: !!report.urgent_action && !isHealthy },
                  { label: '🌿 Organic treatment', val: report.organic_treatment, show: !!report.organic_treatment && !isHealthy },
                  { label: '🧪 Chemical treatment', val: report.chemical_treatment, show: !!report.chemical_treatment && !isHealthy },
                  { label: '🛡 Prevention', val: report.prevention, show: !!report.prevention },
                ].filter(r => r.show).map((r, i) => (
                  <div key={i} style={{ padding: '9px 11px', backgroundColor: r.urgent ? 'var(--color-danger-light)' : 'var(--color-bg-base)', borderRadius: 7, border: `1px solid ${r.urgent ? 'rgba(220,38,38,0.15)' : 'var(--color-border)'}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: r.urgent ? 'var(--color-danger)' : 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{r.label}</div>
                    <div style={{ fontSize: 12, color: r.urgent ? 'var(--color-danger)' : 'var(--color-text-body)', lineHeight: 1.5 }}>{r.val}</div>
                  </div>
                ))}
              </div>

              {/* Meta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--color-text-muted)', paddingTop: 6, borderTop: '1px solid var(--color-border)' }}>
                <span>{report.filename} · {report.file_size_kb} KB</span>
                <span>{report.processed_by_model || 'qwen3-vl:4b'}</span>
              </div>
            </div>
          ) : (
            <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10, maxWidth: 260 }}>
              <Leaf size={28} color="var(--color-primary-medium)" />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-body)' }}>Awaiting leaf photo</div>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                Upload a plant leaf image. qwen3-vl:4b will analyze for disease, pests, nutrient deficiency, and stress.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Diagnostics history */}
      {history && history.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            Recent Scans ({history.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.slice(0, 5).map((h, i) => {
              const cfg = CATEGORY_CONFIG[h.category] || (h.status === 'Healthy' ? CATEGORY_CONFIG['Healthy'] : CATEGORY_CONFIG['Disease']);
              const sev = SEVERITY_CONFIG[h.severity] || SEVERITY_CONFIG['Medium'];
              return (
                <div key={i} style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 7, backgroundColor: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {h.status === 'Healthy' ? <ShieldCheck size={16} color={cfg.color} /> : <Bug size={16} color={cfg.color} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-title)' }}>{h.diagnosis || 'Unknown'}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>{h.filename} · {h.timestamp}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {h.category && h.category !== 'Healthy' && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, backgroundColor: cfg.bg, padding: '2px 7px', borderRadius: 20 }}>{h.category}</span>
                    )}
                    {h.severity && h.severity !== 'None' && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: sev.color, backgroundColor: sev.bg, padding: '2px 7px', borderRadius: 20 }}>{h.severity}</span>
                    )}
                    <span style={{ fontSize: 10, fontWeight: 700, color: h.status === 'Healthy' ? 'var(--color-success)' : 'var(--color-danger)', backgroundColor: h.status === 'Healthy' ? 'var(--color-success-light)' : 'var(--color-danger-light)', padding: '2px 7px', borderRadius: 20 }}>
                      {h.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Inject scan laser animation if not in CSS
const style = document.createElement('style');
style.textContent = `@keyframes scanLaser { 0%{top:0%;} 50%{top:95%;} 100%{top:0%;} }`;
document.head.appendChild(style);
