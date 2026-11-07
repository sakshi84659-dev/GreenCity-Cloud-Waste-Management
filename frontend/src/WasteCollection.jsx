
import { useEffect, useState } from "react";
import { API_BASE_URL } from "./config";
import { Plus, Search, Pencil, Trash2, RefreshCw, X } from "lucide-react";

const API = `${API_BASE_URL}/waste-collections`;

const emptyForm = {
  location: "",
  waste_type: "Plastic",
  quantity: "",
  collection_date: "",
  vehicle_number: "",
  status: "Scheduled"
};

export default function WasteCollection() {
  const [collections, setCollections] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadCollections = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(API);
      if (!response.ok) throw new Error("Unable to load collections");
      const data = await response.json();
      setCollections(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `${API}/${editingId}` : API;
      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Operation failed");

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      loadCollections();
    } catch (err) {
      setError(err.message);
    }
  };

  const editCollection = (item) => {
    setForm({
      location: item.location,
      waste_type: item.waste_type,
      quantity: item.quantity,
      collection_date: item.collection_date?.slice(0, 10) || "",
      vehicle_number: item.vehicle_number || "",
      status: item.status
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const deleteCollection = async (id) => {
    if (!window.confirm("Delete this collection record?")) return;

    try {
      const response = await fetch(`${API}/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Delete failed");
      loadCollections();
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered = collections.filter((item) =>
    `${item.location} ${item.waste_type} ${item.vehicle_number || ""} ${item.status}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const collected = collections.filter((item) => item.status === "Collected").length;
  const scheduled = collections.filter((item) => item.status === "Scheduled").length;
  const pending = collections.filter((item) => item.status === "Pending").length;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Waste Collection</h1>
          <p>Schedule and manage waste collection activities.</p>
        </div>
        <button className="primary-btn" onClick={() => {
          setForm(emptyForm);
          setEditingId(null);
          setShowForm(true);
        }}>
          <Plus size={18} /> Add Collection
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total Collections</span>
          <h2>{collections.length}</h2>
        </div>
        <div className="stat-card">
          <span>Scheduled</span>
          <h2>{scheduled}</h2>
        </div>
        <div className="stat-card">
          <span>Collected</span>
          <h2>{collected}</h2>
        </div>
        <div className="stat-card">
          <span>Pending</span>
          <h2>{pending}</h2>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}

      {showForm && (
        <div className="form-panel">
          <div className="form-panel-header">
            <h2>{editingId ? "Edit Collection" : "Add New Collection"}</h2>
            <button className="icon-btn" onClick={() => setShowForm(false)}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="collection-form">
            <label>
              Collection Location *
              <input name="location" value={form.location} onChange={handleChange} required placeholder="Enter location" />
            </label>

            <label>
              Waste Type *
              <select name="waste_type" value={form.waste_type} onChange={handleChange} required>
                <option>Plastic</option>
                <option>Organic</option>
                <option>Paper</option>
                <option>Metal</option>
                <option>Glass</option>
                <option>Electronic</option>
                <option>Mixed Waste</option>
              </select>
            </label>

            <label>
              Quantity (kg) *
              <input name="quantity" type="number" min="0.01" step="0.01" value={form.quantity} onChange={handleChange} required placeholder="Enter quantity" />
            </label>

            <label>
              Collection Date *
              <input name="collection_date" type="date" value={form.collection_date} onChange={handleChange} required />
            </label>

            <label>
              Vehicle Number
              <input name="vehicle_number" value={form.vehicle_number} onChange={handleChange} placeholder="e.g. MH02AB1234" />
            </label>

            <label>
              Status
              <select name="status" value={form.status} onChange={handleChange}>
                <option>Scheduled</option>
                <option>Collected</option>
                <option>Pending</option>
              </select>
            </label>

            <div className="form-actions">
              <button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="primary-btn">{editingId ? "Update Collection" : "Save Collection"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-panel">
        <div className="table-toolbar">
          <h2>Collection Records</h2>
          <div className="search-box">
            <Search size={17} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search collections..." />
            <button className="icon-btn" onClick={loadCollections} title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Location</th>
                <th>Waste Type</th>
                <th>Quantity (kg)</th>
                <th>Date</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8">Loading collections...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8">No collection records found.</td></tr>
              ) : filtered.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.location}</td>
                  <td>{item.waste_type}</td>
                  <td>{item.quantity}</td>
                  <td>{String(item.collection_date).slice(0, 10)}</td>
                  <td>{item.vehicle_number || "-"}</td>
                  <td><span className={`status-badge ${item.status.toLowerCase()}`}>{item.status}</span></td>
                  <td>
                    <button className="icon-btn" onClick={() => editCollection(item)} title="Edit">
                      <Pencil size={16} />
                    </button>
                    <button className="icon-btn" onClick={() => deleteCollection(item.id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
