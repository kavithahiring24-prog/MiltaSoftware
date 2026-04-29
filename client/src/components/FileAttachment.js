import { useEffect, useRef, useState } from "react";
import { deleteAttachment, getAttachments, uploadAttachment } from "../services/auth";

const ICON = {
  "image/":       "🖼️",
  "application/pdf": "📄",
  "application/vnd": "📊",
  "text/":        "📝",
  "application/zip": "📦",
};

function fileIcon(mime = "") {
  for (const [prefix, icon] of Object.entries(ICON)) {
    if (mime.startsWith(prefix)) return icon;
  }
  return "📎";
}

function formatBytes(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function FileAttachment({ taskId, projectId, issueId, canUpload = true }) {
  const [files, setFiles]       = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const inputRef = useRef(null);

  const params = {};
  if (taskId)    params.taskId    = taskId;
  if (projectId) params.projectId = projectId;
  if (issueId)   params.issueId   = issueId;

  const load = async () => {
    try {
      const data = await getAttachments(params);
      setFiles(data || []);
    } catch {
      setError("Failed to load attachments");
    }
  };

  useEffect(() => { load(); }, [taskId, projectId, issueId]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(""); setSuccess(""); setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (taskId)    fd.append("taskId",    taskId);
      if (projectId) fd.append("projectId", projectId);
      if (issueId)   fd.append("issueId",   issueId);
      await uploadAttachment(fd);
      setSuccess("File uploaded.");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this attachment?")) return;
    setError(""); setSuccess("");
    try {
      await deleteAttachment(id);
      setSuccess("Attachment deleted.");
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div style={{ marginTop: "16px" }}>
      <div className="panel-head" style={{ marginBottom: "10px" }}>
        <h2 style={{ fontSize: "13px", fontWeight: 700, color: "#19314b" }}>
          Attachments {files.length > 0 && <span className="badge">{files.length}</span>}
        </h2>
        {canUpload && (
          <label
            style={{
              cursor: uploading ? "not-allowed" : "pointer",
              fontSize: "12px",
              padding: "5px 12px",
              borderRadius: "6px",
              border: "1px solid #d0dce8",
              background: uploading ? "#f0f3f7" : "#fff",
              color: uploading ? "#7a93b4" : "#19314b",
              fontWeight: 600,
            }}
          >
            {uploading ? "Uploading…" : "＋ Attach File"}
            <input
              ref={inputRef}
              type="file"
              style={{ display: "none" }}
              onChange={handleUpload}
              disabled={uploading}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.zip"
            />
          </label>
        )}
      </div>

      {error   && <p className="error-text" style={{ fontSize: "12px", margin: "4px 0" }}>{error}</p>}
      {success && <p className="success-text" style={{ fontSize: "12px", margin: "4px 0" }}>{success}</p>}

      {files.length === 0 ? (
        <p style={{ fontSize: "12px", color: "#b0bfcf", margin: "8px 0 0" }}>No attachments yet.</p>
      ) : (
        <div className="list-wrap" style={{ maxHeight: "240px" }}>
          {files.map((f) => (
            <div key={f.id} className="list-item polished-item" style={{ padding: "8px 14px", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>{fileIcon(f.mimeType)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <a
                  href={f.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontWeight: 600, fontSize: "12px", color: "#0b66e4", textDecoration: "none" }}
                >
                  {f.originalName}
                </a>
                <p style={{ margin: 0, fontSize: "11px", color: "#7a93b4" }}>
                  {formatBytes(f.size)} &nbsp;·&nbsp;
                  {new Date(f.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  {f.UploadedBy && ` · ${f.UploadedBy.name}`}
                </p>
              </div>
              {canUpload && (
                <button
                  type="button"
                  className="secondary-btn"
                  style={{ fontSize: "11px", padding: "3px 8px" }}
                  onClick={() => handleDelete(f.id)}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileAttachment;
