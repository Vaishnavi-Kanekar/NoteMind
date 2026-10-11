// src/components/notes/KnowledgeBase.jsx
import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import "./KnowledgeBase.css";

/* ── colour helpers ─────────────────────────────────────────────────────── */
const SUBJECT_COLORS = [
  "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#6366f1",
];
function subjectColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return SUBJECT_COLORS[Math.abs(h) % SUBJECT_COLORS.length];
}
function fileExt(filename) {
  if (!filename) return "FILE";
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toUpperCase() : "FILE";
}

const TYPE_STYLE = {
  digital:     { bg: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "rgba(59,130,246,0.3)", label: "Digital" },
  handwritten: { bg: "rgba(168,85,247,0.12)", color: "#c084fc", border: "rgba(168,85,247,0.3)", label: "Handwritten" },
};
const DEFAULT_TYPE = { bg: "rgba(100,116,139,0.1)", color: "#94a3b8", border: "rgba(100,116,139,0.3)", label: "File" };

/* ── Icons ──────────────────────────────────────────────────────────────── */
const DownloadIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const ViewIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const SpinIcon = () => (
  <svg className="kb-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

/* ── DownloadButton ─────────────────────────────────────────────────────── */
function DownloadButton({ fileId, filename }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await api.get(`/files/${fileId}/download/`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Download failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`kb-action-btn${done ? " done" : ""}`}
      onClick={handleDownload}
      disabled={loading}
    >
      {loading ? <SpinIcon /> : done ? null : <DownloadIcon />}
      {loading ? "Downloading…" : done ? "Downloaded ✓" : "Download"}
    </button>
  );
}

/* ── ViewButton ─────────────────────────────────────────────────────────── */
function ViewButton({ fileId }) {
  const [loading, setLoading] = useState(false);

  const handleView = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Fetch as blob then open in a new tab — this carries the auth header,
      // unlike a plain <a href> which can't send the Authorization header.
      const response = await api.get(`/files/${fileId}/view/`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      window.open(url, "_blank", "noopener,noreferrer");
      // revoke a bit later so the new tab has time to load it
      setTimeout(() => window.URL.revokeObjectURL(url), 30000);
    } catch (err) {
      console.error("View failed:", err);
      alert("Could not open file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="kb-action-btn" onClick={handleView} disabled={loading}>
      {loading ? <SpinIcon /> : <ViewIcon />}
      {loading ? "Opening…" : "View"}
    </button>
  );
}

/* ── FileCard (grid view inside subject sections) ──────────────────────── */
function FileCard({ file }) {
  const ts = TYPE_STYLE[file.file_type] || DEFAULT_TYPE;
  const color = subjectColor(file.subject || "General");
  const ext = fileExt(file.filename);

  return (
    <div className="kb-card">
      <div className="kb-card-top">
        <div className="kb-card-icon" style={{ background: color + "18", color }}>
          {ext.slice(0, 4)}
        </div>
        <span className="kb-type-badge" style={{ background: ts.bg, color: ts.color, borderColor: ts.border }}>
          {ts.label}
        </span>
      </div>

      <span className="kb-card-name">{file.filename}</span>

      <div className="kb-card-meta">
        <span className="kb-meta-row"><span>🕐</span>{file.uploaded_at}</span>
      </div>

      <div className="kb-card-actions">
        <ViewButton fileId={file.id} />
        <DownloadButton fileId={file.id} filename={file.filename} />
      </div>
    </div>
  );
}

/* ── SearchResult (stacked layout, not cramped horizontal) ─────────────── */
function SearchResult({ file, query }) {
  const ts = TYPE_STYLE[file.file_type] || DEFAULT_TYPE;
  const color = subjectColor(file.subject || "General");

  const highlight = (text, q) => {
    if (!q || !text) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: color + "30", color, borderRadius: 2, padding: "0 2px" }}>
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div className="kb-result-card">
      <div className="kb-result-top">
        <div className="kb-result-icon" style={{ background: color + "18", color }}>
          {fileExt(file.filename).slice(0, 4)}
        </div>

        <div className="kb-result-info">
          <div className="kb-result-name">{highlight(file.filename, query)}</div>
          <div className="kb-result-tags">
            <span className="kb-tag" style={{ background: color + "18", color, borderColor: color + "40" }}>
              {file.subject || "General"}
            </span>
            <span className="kb-tag" style={{ background: ts.bg, color: ts.color, borderColor: ts.border }}>
              {ts.label}
            </span>
            <span className="kb-tag" style={{ background: "transparent", color: "#6b7280", borderColor: "#2a2d3e" }}>
              {file.chunk_count} chunks
            </span>
            <span className="kb-result-date">{(file.uploaded_at || "").split(",")[0]}</span>
          </div>
        </div>
      </div>

      <div className="kb-result-actions">
        <ViewButton fileId={file.id} />
        <DownloadButton fileId={file.id} filename={file.filename} />
      </div>
    </div>
  );
}

/* ── KnowledgeBase (main component) ─────────────────────────────────────── */
export default function KnowledgeBase({ onUploadClick, refreshKey }) {
  const [allFiles, setAllFiles] = useState([]);
  const [subjects, setSubjects] = useState({});
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/files/");
      if (Array.isArray(res.data)) {
        const flat = res.data;
        setAllFiles(flat);
        setTotal(flat.length);
        const grouped = {};
        flat.forEach(f => {
          const s = f.subject || "General";
          if (!grouped[s]) grouped[s] = [];
          grouped[s].push(f);
        });
        setSubjects(grouped);
      } else {
        setAllFiles(res.data.files || []);
        setSubjects(res.data.subjects || {});
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error("KnowledgeBase fetch error:", err);
      setError(
        err.response?.status === 401
          ? "Session expired. Please log in again."
          : "Could not load files. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles, refreshKey]);

  const q = query.trim().toLowerCase();
  const results = q
    ? allFiles.filter(f =>
        (f.filename || "").toLowerCase().includes(q) ||
        (f.subject || "").toLowerCase().includes(q)
      )
    : [];

  const subjectNames = Object.keys(subjects).sort();

  return (
    <div className="kb-root">

      {/* ── Header ── */}
      <div className="kb-header">
        <div className="kb-title-row">
          <div>
            <h2 className="kb-h2">Knowledge Base</h2>
            <p className="kb-sub">Browse, search and download your source documents</p>
          </div>
          {!loading && !error && (
            <div className="kb-chips">
              <span className="kb-chip">
                <span className="kb-dot" style={{ background: "#60a5fa" }} />
                {total} file{total !== 1 ? "s" : ""}
              </span>
              <span className="kb-chip">
                <span className="kb-dot" style={{ background: "#a78bfa" }} />
                {subjectNames.length} subject{subjectNames.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {!loading && !error && total > 0 && (
          <div className="kb-search-wrap">
            <span className="kb-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              className="kb-search-input"
              placeholder="Search by filename or subject…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button className="kb-clear-btn" onClick={() => setQuery("")}>×</button>
            )}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="kb-body">

        {loading && (
          <div className="kb-centered">
            <div className="kb-empty-icon">⏳</div>
            <span className="kb-empty-desc">Loading your notes…</span>
          </div>
        )}

        {!loading && error && (
          <div className="kb-centered">
            <div className="kb-empty-icon">⚠️</div>
            <span className="kb-empty-title">Something went wrong</span>
            <span className="kb-empty-desc">{error}</span>
            <button className="kb-retry-btn" onClick={fetchFiles}>Retry</button>
          </div>
        )}

        {!loading && !error && total === 0 && (
          <div className="kb-centered">
            <div className="kb-empty-icon">📂</div>
            <span className="kb-empty-title">No notes uploaded yet</span>
            <span className="kb-empty-desc">
              Upload your first PDF, Word doc, or handwritten note to get started.
            </span>
            {onUploadClick && (
              <button className="kb-upload-btn" onClick={onUploadClick}>
                + Upload a note
              </button>
            )}
          </div>
        )}

        {!loading && !error && q && (
          <>
            <div className="kb-result-label">
              {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
            </div>
            {results.length === 0 ? (
              <div className="kb-centered">
                <div className="kb-empty-icon">🔍</div>
                <span className="kb-empty-title">No files found</span>
                <span className="kb-empty-desc">Nothing matches &ldquo;{query}&rdquo;.</span>
              </div>
            ) : (
              <div className="kb-result-list">
                {results.map(f => (
                  <SearchResult key={f.id} file={f} query={query} />
                ))}
              </div>
            )}
          </>
        )}

        {!loading && !error && total > 0 && !q &&
          subjectNames.map(name => {
            const files = subjects[name] || [];
            const color = subjectColor(name);
            return (
              <div key={name} className="kb-section">
                <div className="kb-sec-header">
                  <span className="kb-sec-label" style={{ color }}>{name}</span>
                  <span className="kb-sec-count">{files.length}</span>
                  <div className="kb-sec-line" />
                </div>
                <div className="kb-grid">
                  {files.map(f => <FileCard key={f.id} file={f} />)}
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}