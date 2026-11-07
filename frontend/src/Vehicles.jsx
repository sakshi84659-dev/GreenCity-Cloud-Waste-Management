
import { useEffect, useState } from "react";
import { API_BASE_URL } from "./config";
import { Plus, Search, Trash2, Pencil, RefreshCw } from "lucide-react";

const API = `${API_BASE_URL}/vehicles`;

const emptyForm = {
  vehicle_number: "",
  vehicle_type: "Garbage Truck",
  driver_name: "",
  driver_phone: "",
  capacity: "",
  status: "Active"
};

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadVehicles = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error("Unable to load vehicles.");
      const data = await response.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message + " Check your backend and vehicles table.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const saveVehicle = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        editingId ? `${API}/${editingId}` : API,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save vehicle.");

      setMessage(editingId ? "Vehicle updated successfully." : "Vehicle added successfully.");
      setForm(emptyForm);
      setEditingId(null);
      await loadVehicles();
    } catch (err) {
      setError(err.message);
    }
  };

  const editVehicle = (vehicle) => {
    setForm({
      vehicle_number: vehicle.vehicle_number || "",
      vehicle_type: vehicle.vehicle_type || "Garbage Truck",
      driver_name: vehicle.driver_name || "",
      driver_phone: vehicle.driver_phone || "",
      capacity: vehicle.capacity || "",
      status: vehicle.status || "Active"
    });
    setEditingId(vehicle.id);
    setMessage("");
    setError("");
  };

  const deleteVehicle = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?")) return;

    try {
      const response = await fetch(`${API}/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to delete vehicle.");

      setMessage("Vehicle deleted successfully.");
      await loadVehicles();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    [
      vehicle.vehicle_number,
      vehicle.vehicle_type,
      vehicle.driver_name,
      vehicle.status
    ].some(value =>
      String(value || "").toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div>
      <section className="page-heading">
        <div>
          <h1>Vehicle Management</h1>
          <p>Add, update, search and manage waste collection vehicles.</p>
        </div>
        <span className="date-label">Fleet Management</span>
      </section>

      <section className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-top">Total Vehicles</div>
          <h2>{vehicles.length}</h2>
        </div>
        <div className="stat-card green">
          <div className="stat-top">Active</div>
          <h2>{vehicles.filter(v => v.status === "Active").length}</h2>
        </div>
        <div className="stat-card orange">
          <div className="stat-top">Inactive</div>
          <h2>{vehicles.filter(v => v.status === "Inactive").length}</h2>
        </div>
        <div className="stat-card purple">
          <div className="stat-top">Maintenance</div>
          <h2>{vehicles.filter(v => v.status === "Maintenance").length}</h2>
        </div>
      </section>

      <section className="panel complaint-form-panel">
        <div className="panel-heading">
          <div>
            <h3><Plus size={18} /> {editingId ? "Edit Vehicle" : "Add New Vehicle"}</h3>
            <p>Enter the vehicle and driver details.</p>
          </div>
        </div>

        <form className="complaint-form" onSubmit={saveVehicle}>
          <label>
            Vehicle Number
            <input name="vehicle_number" required value={form.vehicle_number} onChange={handleChange} placeholder="MH02AB1234" />
          </label>

          <label>
            Vehicle Type
            <select name="vehicle_type" value={form.vehicle_type} onChange={handleChange}>
              <option>Garbage Truck</option>
              <option>Mini Truck</option>
              <option>Waste Collection Van</option>
              <option>Recycling Vehicle</option>
            </select>
          </label>

          <label>
            Driver Name
            <input name="driver_name" required value={form.driver_name} onChange={handleChange} placeholder="Enter driver name" />
          </label>

          <label>
            Driver Phone
            <input name="driver_phone" value={form.driver_phone} onChange={handleChange} placeholder="Enter phone number" />
          </label>

          <label>
            Capacity (kg)
            <input name="capacity" type="number" min="1" required value={form.capacity} onChange={handleChange} placeholder="2000" />
          </label>

          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              <option>Active</option>
              <option>Inactive</option>
              <option>Maintenance</option>
            </select>
          </label>

          <button className="submit-btn" type="submit">
            {editingId ? "Update Vehicle" : "Add Vehicle"}
          </button>

          {editingId && (
            <button
              className="refresh-btn"
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancel Edit
            </button>
          )}
        </form>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>All Vehicles</h3>
            <p>Vehicle records from MySQL database</p>
          </div>
          <button className="refresh-btn" onClick={loadVehicles}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        <div className="search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search vehicle, driver or status..."
          />
        </div>

        {loading ? (
          <p className="muted">Loading vehicles...</p>
        ) : (
          <div className="table-wrap">
            <table className="complaints-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Vehicle Number</th>
                  <th>Type</th>
                  <th>Driver</th>
                  <th>Phone</th>
                  <th>Capacity (kg)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map(vehicle => (
                  <tr key={vehicle.id}>
                    <td>{vehicle.id}</td>
                    <td>{vehicle.vehicle_number}</td>
                    <td>{vehicle.vehicle_type}</td>
                    <td>{vehicle.driver_name}</td>
                    <td>{vehicle.driver_phone}</td>
                    <td>{vehicle.capacity}</td>
                    <td><span className="complaint-status">{vehicle.status}</span></td>
                    <td>
                      <button className="icon-btn" onClick={() => editVehicle(vehicle)} title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button className="icon-btn delete-btn" onClick={() => deleteVehicle(vehicle.id)} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!filteredVehicles.length && (
              <p className="muted">No vehicles found. Add your first vehicle above.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
