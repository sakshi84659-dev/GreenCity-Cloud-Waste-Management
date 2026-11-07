
import { useEffect, useState } from "react";
import { API_BASE_URL } from "./config";
import { Plus, RefreshCw, Trash2, Pencil, X, Users as UsersIcon } from "lucide-react";

const API = `${API_BASE_URL}/users`;

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Staff",
    status: "Active"
  });

  const getHeaders = () => {
    const token = sessionStorage.getItem("greencity_token");

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
  };

  const loadUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API, {
        headers: getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load users.");
      }

      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      email: "",
      password: "",
      role: "Staff",
      status: "Active"
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const url = editingId ? `${API}/${editingId}` : `${API}/register`;
      const method = editingId ? "PUT" : "POST";

      const body = editingId
        ? {
            name: form.name,
            email: form.email,
            role: form.role,
            status: form.status
          }
        : {
            name: form.name,
            email: form.email,
            password: form.password
          };

      const response = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save user.");
      }

      setMessage(data.message);
      resetForm();
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status
    });
    setMessage("");
    setError("");
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete user.");
      }

      setMessage(data.message);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="users-page">
      <section className="page-heading">
        <div>
          <h1>User Management</h1>
          <p>Manage GreenCity administrators and staff accounts.</p>
        </div>
        <span className="date-label">
          <UsersIcon size={16} /> {users.length} Users
        </span>
      </section>

      <section className="panel users-form-panel">
        <div className="panel-heading">
          <div>
            <h3>{editingId ? "Edit User" : "Add New User"}</h3>
            <p>{editingId ? "Update user details." : "Create a new staff account."}</p>
          </div>
          {editingId && (
            <button className="refresh-btn" onClick={resetForm}>
              <X size={15} /> Cancel
            </button>
          )}
        </div>

        <form className="users-form" onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter full name"
            />
          </label>

          <label>
            Email Address
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Enter email address"
            />
          </label>

          {!editingId && (
            <label>
              Password
              <input
                required
                type="password"
                minLength="8"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 8 characters"
              />
            </label>
          )}

          {editingId && (
            <>
              <label>
                Role
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="Staff">Staff</option>
                  <option value="Admin">Admin</option>
                </select>
              </label>

              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
            </>
          )}

          <button className="submit-btn" type="submit">
            <Plus size={17} />
            {editingId ? "Update User" : "Create Staff Account"}
          </button>
        </form>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </section>

      <section className="panel users-table-panel">
        <div className="panel-heading">
          <div>
            <h3>All Users</h3>
            <p>User records retrieved from MySQL.</p>
          </div>
          <button className="refresh-btn" onClick={loadUsers}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {loading ? (
          <p className="muted">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="muted">No users found.</p>
        ) : (
          <div className="table-wrap">
            <table className="complaints-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>#{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.status}</td>
                    <td>
                      <button className="refresh-btn" onClick={() => startEdit(user)}>
                        <Pencil size={14} /> Edit
                      </button>
                      <button className="refresh-btn" onClick={() => deleteUser(user.id)}>
                        <Trash2 size={14} /> Delete
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

export default Users;
