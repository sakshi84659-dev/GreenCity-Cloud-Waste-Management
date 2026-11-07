import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, RefreshCw, Search, Eye, Trash2, X, ImagePlus } from "lucide-react";
import "./Complaints.css";
import { API_BASE_URL } from "../config";

const API = API_BASE_URL;

const CATEGORIES = [
  "Garbage Collection",
  "Overflowing Dustbin",
  "Street Cleaning",
  "Waste Disposal",
  "Other"
];
const STATUSES = ["Pending", "In Progress", "Resolved"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const emptyForm = {
  name: "",
  location: "",
  category: "Garbage Collection",
  description: ""
};

const statusClass = (status) => `complaint-status ${String(status || "").toLowerCase().replace(" ", "-")}`;
const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

function Complaints({ onChanged }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState(null);

  const [filters, setFilters] = useState({ search: "", category: "", status: "" });

  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef(null);

  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const latestRequest = useRef(0);

  const showToast = (type, text) => setToast({ type, text });

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadComplaints = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setLoading(true);
    setLoadError("");

    try {
      const params = new URLSearchParams();
      if (filters.search.trim()) params.set("search", filters.search.trim());
      if (filters.category) params.set("category", filters.category);
      if (filters.status) params.set("status", filters.status);

      const response = await fetch(`${API}/complaints?${params.toString()}`);
      if (!response.ok) throw new Error("Unable to load complaints.");
      const data = await response.json();

      if (requestId === latestRequest.current) setComplaints(data);
    } catch (err) {
      if (requestId === latestRequest.current) {
        setLoadError("Cannot connect to the backend. Check that your backend and MySQL are running.");
      }
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [filters]);

  // Reload when filters change (search is debounced so we do not call the API on every key press).
  useEffect(() => {
    const timer = setTimeout(loadComplaints, 300);
    return () => clearTimeout(timer);
  }, [loadComplaints]);

  // Release the temporary preview URL when it changes or the page closes.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const refreshEverything = async () => {
    await loadComplaints();
    if (onChanged) onChanged();
  };

  const chooseFile = (event) => {
    const chosen = event.target.files?.[0];
    if (!chosen) {
      setFile(null);
      setPreview("");
      return;
    }
    if (!ALLOWED_TYPES.includes(chosen.type)) {
      showToast("error", "Please choose a JPG, PNG or WEBP image.");
      event.target.value = "";
      return;
    }
    if (chosen.size > MAX_IMAGE_BYTES) {
      showToast("error", "Image is too large. Maximum size is 5 MB.");
      event.target.value = "";
      return;
    }
    setFile(chosen);
    setPreview(URL.createObjectURL(chosen));
  };

  const removeFile = () => {
    setFile(null);
    setPreview("");
    if (fileInput.current) fileInput.current.value = "";
  };

  const submitComplaint = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      if (file) body.append("image", file);

      const response = await fetch(`${API}/complaints`, { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Complaint submission failed.");

      showToast("success", "Complaint submitted successfully!");
      setForm(emptyForm);
      removeFile();
      await refreshEverything();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    setBusyId(id);
    try {
      const response = await fetch(`${API}/complaints/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update status.");

      showToast("success", `Complaint #${id} marked as ${status}.`);
      setSelected((current) => (current && current.id === id ? { ...current, status } : current));
      await refreshEverything();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const id = toDelete.id;
    setBusyId(id);
    try {
      const response = await fetch(`${API}/complaints/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not delete complaint.");

      showToast("success", `Complaint #${id} deleted.`);
      setToDelete(null);
      setSelected((current) => (current && current.id === id ? null : current));
      await refreshEverything();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setBusyId(null);
    }
  };

  const hasFilters = filters.search || filters.category || filters.status;

  return (
    <>
      <section className="page-heading">
        <div>
          <h1>Complaint Management</h1>
          <p>Submit, search and manage waste management complaints.</p>
        </div>
        <span className="date-label">Database Connected</span>
      </section>

      {toast && (
        <div className={`toast ${toast.type}`} role="status">
          <span>{toast.text}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Close message"><X size={14} /></button>
        </div>
      )}

      <div className="panel complaint-form-panel">
        <div className="panel-heading">
          <div><h3><Plus size={18} /> Submit New Complaint</h3><p>Enter the complaint details below. A photo is optional.</p></div>
        </div>

        <form className="complaint-form" onSubmit={submitComplaint}>
          <label>
            Full Name
            <input
              required
              maxLength={100}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter your name"
            />
          </label>

          <label>
            Location
            <input
              required
              maxLength={255}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Enter area or address"
            />
          </label>

          <label>
            Complaint Category
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>

          <label>
            Description
            <textarea
              required
              rows="4"
              maxLength={2000}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the problem..."
            />
          </label>

          <div className="photo-field">
            <span className="photo-label">Photograph (optional, JPG/PNG/WEBP, max 5 MB)</span>
            <div className="photo-row">
              <label className="photo-button">
                <ImagePlus size={16} /> Choose photo
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={chooseFile}
                  hidden
                />
              </label>
              {file && <span className="photo-name">{file.name}</span>}
              {file && (
                <button type="button" className="link-btn" onClick={removeFile}>Remove</button>
              )}
            </div>
            {preview && <img className="photo-preview" src={preview} alt="Selected complaint" />}
          </div>

          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Complaint"}
          </button>
        </form>
      </div>

      <div className="panel complaints-table-panel">
        <div className="panel-heading">
          <div><h3>All Complaints</h3><p>Records retrieved from MySQL ({complaints.length} shown)</p></div>
          <button className="refresh-btn" onClick={refreshEverything}><RefreshCw size={15} /> Refresh</button>
        </div>

        <div className="toolbar">
          <div className="toolbar-search">
            <Search size={16} />
            <input
              placeholder="Search name, location, description or ID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          {hasFilters && (
            <button
              className="link-btn"
              onClick={() => setFilters({ search: "", category: "", status: "" })}
            >
              Clear filters
            </button>
          )}
        </div>

        {loadError && <p className="error-message">{loadError}</p>}

        {loading && !complaints.length ? <p className="muted">Loading complaints...</p> : (
          <div className="table-wrap">
            <table className="complaints-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Photo</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.location}</td>
                    <td>{item.category}</td>
                    <td className="desc-cell">{item.description}</td>
                    <td>
                      {item.image_url
                        ? <img className="thumb" src={item.image_url} alt={`Complaint ${item.id}`} />
                        : <span className="muted-inline">-</span>}
                    </td>
                    <td>
                      <select
                        className={`status-select ${statusClass(item.status)}`}
                        value={item.status}
                        disabled={busyId === item.id}
                        onChange={(e) => updateStatus(item.id, e.target.value)}
                        aria-label={`Status of complaint ${item.id}`}
                      >
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" title="View details" onClick={() => setSelected(item)}>
                          <Eye size={15} />
                        </button>
                        <button className="icon-btn danger" title="Delete" onClick={() => setToDelete(item)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!complaints.length && !loadError && (
              <p className="muted">
                {hasFilters ? "No complaints match your search or filters." : "No complaints found. Submit your first complaint above."}
              </p>
            )}
          </div>
        )}
      </div>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-head">
              <h3>Complaint #{selected.id}</h3>
              <button className="icon-btn" onClick={() => setSelected(null)} aria-label="Close"><X size={16} /></button>
            </div>

            <dl className="details-list">
              <div><dt>Name</dt><dd>{selected.name}</dd></div>
              <div><dt>Location</dt><dd>{selected.location}</dd></div>
              <div><dt>Category</dt><dd>{selected.category}</dd></div>
              <div><dt>Submitted</dt><dd>{formatDate(selected.created_at)}</dd></div>
              <div><dt>Last updated</dt><dd>{formatDate(selected.updated_at)}</dd></div>
              <div className="full"><dt>Description</dt><dd>{selected.description}</dd></div>
            </dl>

            {selected.image_url && (
              <img className="detail-photo" src={selected.image_url} alt={`Complaint ${selected.id}`} />
            )}

            <div className="modal-status">
              <span>Status</span>
              <select
                className={`status-select ${statusClass(selected.status)}`}
                value={selected.status}
                disabled={busyId === selected.id}
                onChange={(e) => updateStatus(selected.id, e.target.value)}
              >
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {toDelete && (
        <div className="modal-backdrop" onClick={() => setToDelete(null)}>
          <div className="modal small" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
            <h3>Delete complaint #{toDelete.id}?</h3>
            <p className="confirm-text">
              This will permanently remove the complaint from {toDelete.name} at {toDelete.location}
              {toDelete.image_url ? ", including its photo" : ""}. This cannot be undone.
            </p>
            <div className="modal-buttons">
              <button className="btn-secondary" onClick={() => setToDelete(null)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDelete} disabled={busyId === toDelete.id}>
                {busyId === toDelete.id ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Complaints;
