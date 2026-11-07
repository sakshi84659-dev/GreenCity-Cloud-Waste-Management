
import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  X
} from "lucide-react";
import LocationMap from "./LocationMap";
import { API_BASE_URL } from "./config";

const API = `${API_BASE_URL}/collection-locations`;

const emptyForm = {
  location_name: "",
  address: "",
  area: "",
  latitude: "",
  longitude: "",
  bin_capacity: "",
  waste_type: "General Waste",
  status: "Active"
};

function CollectionLocations() {
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadLocations = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error("Unable to load locations.");

      const data = await response.json();
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const payload = {
      ...form,
      latitude: form.latitude === "" ? null : Number(form.latitude),
      longitude: form.longitude === "" ? null : Number(form.longitude),
      bin_capacity: form.bin_capacity === "" ? null : Number(form.bin_capacity)
    };

    try {
      const response = await fetch(
        editingId ? `${API}/${editingId}` : API,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save location.");
      }

      setMessage(
        editingId
          ? "Location updated successfully!"
          : "Location added successfully!"
      );

      setForm(emptyForm);
      setEditingId(null);
      await loadLocations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (location) => {
    setEditingId(location.id);

    setForm({
      location_name: location.location_name || "",
      address: location.address || "",
      area: location.area || "",
      latitude: location.latitude ?? "",
      longitude: location.longitude ?? "",
      bin_capacity: location.bin_capacity ?? "",
      waste_type: location.waste_type || "General Waste",
      status: location.status || "Active"
    });

    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this collection location?")) return;

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete location.");
      }

      setMessage("Location deleted successfully!");
      await loadLocations();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredLocations = locations.filter(location =>
    [
      location.location_name,
      location.address,
      location.area,
      location.waste_type,
      location.status
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="collection-page">
      <section className="page-heading">
        <div>
          <h1>Collection Locations</h1>
          <p>Manage waste collection points across different areas.</p>
        </div>
        <span className="date-label">Location Management</span>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Collection Location Map</h3>
            <p>View collection points across Mumbai.</p>
          </div>
        </div>

        <LocationMap locations={locations} />
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>
              {editingId
                ? "Edit Collection Location"
                : "Add New Collection Location"}
            </h3>
            <p>Enter the collection point details.</p>
          </div>
        </div>

        <form className="collection-form" onSubmit={handleSubmit}>
          <label>
            Location Name
            <input
              name="location_name"
              value={form.location_name}
              onChange={handleChange}
              placeholder="Enter location name"
              required
            />
          </label>

          <label>
            Address
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Enter complete address"
              required
            />
          </label>

          <label>
            Area
            <input
              name="area"
              value={form.area}
              onChange={handleChange}
              placeholder="Enter area"
              required
            />
          </label>

          <label>
            Latitude
            <input
              type="number"
              step="any"
              name="latitude"
              value={form.latitude}
              onChange={handleChange}
              placeholder="19.0596"
            />
          </label>

          <label>
            Longitude
            <input
              type="number"
              step="any"
              name="longitude"
              value={form.longitude}
              onChange={handleChange}
              placeholder="72.8295"
            />
          </label>

          <label>
            Bin Capacity (kg)
            <input
              type="number"
              min="0"
              step="any"
              name="bin_capacity"
              value={form.bin_capacity}
              onChange={handleChange}
              placeholder="500"
            />
          </label>

          <label>
            Waste Type
            <select
              name="waste_type"
              value={form.waste_type}
              onChange={handleChange}
            >
              <option>General Waste</option>
              <option>Organic Waste</option>
              <option>Plastic Waste</option>
              <option>Paper Waste</option>
              <option>Electronic Waste</option>
              <option>Recyclable Waste</option>
            </select>
          </label>

          <label>
            Status
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option>Active</option>
              <option>Inactive</option>
              <option>Full</option>
            </select>
          </label>

          <div className="form-actions">
            <button type="submit" className="submit-btn">
              <Plus size={17} />
              {editingId ? "Update Location" : "Add Location"}
            </button>

            {editingId && (
              <button
                type="button"
                className="refresh-btn"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                <X size={17} /> Cancel
              </button>
            )}
          </div>
        </form>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>All Collection Locations</h3>
            <p>Records retrieved from MySQL.</p>
          </div>

          <button
            className="refresh-btn"
            onClick={loadLocations}
            type="button"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Search locations..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>

        {loading ? (
          <p className="muted">Loading locations...</p>
        ) : filteredLocations.length === 0 ? (
          <p className="muted">No collection locations found.</p>
        ) : (
          <div className="table-wrap">
            <table className="complaints-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Location</th>
                  <th>Address</th>
                  <th>Area</th>
                  <th>Capacity</th>
                  <th>Waste Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredLocations.map(location => (
                  <tr key={location.id}>
                    <td>#{location.id}</td>
                    <td>{location.location_name}</td>
                    <td>{location.address}</td>
                    <td>{location.area}</td>
                    <td>{location.bin_capacity ?? "-"} kg</td>
                    <td>{location.waste_type || "-"}</td>
                    <td>{location.status}</td>
                    <td>
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(location)}
                        type="button"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(location.id)}
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default CollectionLocations;
