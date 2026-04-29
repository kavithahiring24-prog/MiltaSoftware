import { useEffect, useState } from "react";
import {
  deleteAttachment,
  getAttachments,
  getStoredUser,
  resolveFileUrl,
  uploadAttachment,
} from "../services/auth";

function formatSize(size) {
  if (!size && size !== 0) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function FileAttachments({ taskId }) {
  const currentUser = getStoredUser();
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!taskId) {
        setAttachments([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const data = await getAttachments({ taskId });
        if (active) setAttachments(data || []);
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Failed to load attachments");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [taskId]);

  const refreshAttachments = async () => {
    const data = await getAttachments({ taskId });
    setAttachments(data || []);
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !taskId) return;

    setIsUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("taskId", String(taskId));
      await uploadAttachment(formData);
      await refreshAttachments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload attachment");
    } finally {
      event.target.value = "";
      setIsUploading(false);
    }
  };

  const handleDelete = async (attachmentId) => {
    setError("");
    try {
      await deleteAttachment(attachmentId);
      setAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete attachment");
    }
  };

  return (
    <section className="discussion-section">
      <div className="panel-head">
        <h3>Files</h3>
        <label className="attachment-upload-btn">
          <input type="file" onChange={handleUpload} disabled={isUploading} hidden />
          {isUploading ? "Uploading..." : "Attach File"}
        </label>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {isLoading ? <p>Loading attachments...</p> : null}

      {!isLoading && attachments.length === 0 ? (
        <p>No files attached yet.</p>
      ) : (
        <div className="attachment-list">
          {attachments.map((attachment) => {
            const canDelete =
              Number(attachment.uploadedById) === Number(currentUser?.id) ||
              ["Admin", "Manager"].includes(currentUser?.role);

            return (
              <article className="attachment-card" key={attachment.id}>
                <div>
                  <a
                    className="attachment-link"
                    href={resolveFileUrl(attachment.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {attachment.originalName}
                  </a>
                  <p>
                    {attachment.UploadedBy?.name || "Unknown"} · {formatSize(attachment.size)}
                  </p>
                </div>
                {canDelete ? (
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => handleDelete(attachment.id)}
                  >
                    Delete
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default FileAttachments;
