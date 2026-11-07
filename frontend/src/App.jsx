
import CollectionLocations from "./CollectionLocations.jsx";
import WasteCollection from "./WasteCollection.jsx";
import Vehicles from "./Vehicles.jsx";
import Reports from "./Reports.jsx";
import Users from "./Users.jsx";
import Login from "./Login.jsx";
import Settings from "./Settings.jsx";
import Complaints from "./components/Complaints.jsx";
import { API_BASE_URL } from "./config";

import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  MessageSquare,
  Truck,
  Recycle,
  BarChart3,
  MapPin,
  Settings as SettingsIcon,
  Bell,
  Users as UsersIcon,
  CheckCircle,
  Clock,
  Menu,
  Plus,
  RefreshCw,
  LogOut
} from "lucide-react";

import "./App.css";

const API = API_BASE_URL;

const getSavedUser = () => {
  try {
    const token = sessionStorage.getItem("greencity_token");
    const user = JSON.parse(
      sessionStorage.getItem("greencity_user") || "null"
    );

    return token && user?.role === "Admin" ? user : null;
  } catch {
    return null;
  }
};

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Complaints", icon: MessageSquare },
  { name: "Vehicles", icon: Truck },
  { name: "Waste Collection", icon: Recycle },
  { name: "Collection Locations", icon: MapPin },
  { name: "Reports & Analytics", icon: BarChart3 },
  { name: "Users", icon: UsersIcon },
  { name: "Settings", icon: SettingsIcon }
];

function App() {
  const [admin, setAdmin] = useState(getSavedUser);
  const [activePage, setActivePage] = useState("Dashboard");
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    location: "",
    category: "Garbage Collection",
    description: ""
  });

  const handleLogin = (user) => {
    setAdmin(user);
    setActivePage("Dashboard");
  };

  const handleProfileUpdate = (updatedUser) => {
    setAdmin(updatedUser);
    sessionStorage.setItem(
      "greencity_user",
      JSON.stringify(updatedUser)
    );
  };

  const handleLogout = () => {
    sessionStorage.removeItem("greencity_token");
    sessionStorage.removeItem("greencity_user");

    setAdmin(null);
    setActivePage("Dashboard");
    setComplaints([]);
    setError("");
    setMessage("");
  };

  const loadComplaints = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/complaints`);

      if (!response.ok) {
        throw new Error("Could not load complaints.");
      }

      const data = await response.json();

      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        "Backend connection failed. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      admin &&
      (activePage === "Dashboard" || activePage === "Complaints")
    ) {
      loadComplaints();
    }
  }, [activePage, admin]);

  const submitComplaint = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API}/complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Complaint submission failed."
        );
      }

      setMessage("Complaint submitted successfully!");

      setForm({
        name: "",
        location: "",
        category: "Garbage Collection",
        description: ""
      });

      await loadComplaints();
    } catch (err) {
      setError(err.message);
    }
  };

  const pending = complaints.filter(
    item => item.status === "Pending"
  ).length;

  const progress = complaints.filter(
    item => item.status === "In Progress"
  ).length;

  const resolved = complaints.filter(
    item => item.status === "Resolved"
  ).length;

  const stats = [
    {
      title: "Total Complaints",
      value: complaints.length,
      description: "Registered complaints",
      icon: MessageSquare,
      color: "purple"
    },
    {
      title: "Pending",
      value: pending,
      description: "Awaiting attention",
      icon: Clock,
      color: "orange"
    },
    {
      title: "In Progress",
      value: progress,
      description: "Currently processing",
      icon: Truck,
      color: "blue"
    },
    {
      title: "Resolved",
      value: resolved,
      description: "Completed complaints",
      icon: CheckCircle,
      color: "green"
    }
  ];

  if (!admin) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2 className="logo">
          GreenCity<span>.</span>
        </h2>

        <div className="admin">
          <div className="avatar">
            {admin.name?.charAt(0).toUpperCase() || "A"}
          </div>

          <div>
            <strong>{admin.name}</strong>
            <small>Administrator</small>
          </div>
        </div>

        <nav>
          {menuItems.map(item => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => {
                  setActivePage(item.name);
                  setError("");
                  setMessage("");
                }}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          Smart Waste Management System
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">
            <Menu size={20} />
            <span>Home / {activePage}</span>
          </div>

          <div className="top-actions">
            <Bell size={20} />

            <div className="profile">
              <div className="avatar">
                {admin.name?.charAt(0).toUpperCase() || "A"}
              </div>

              <span>{admin.name}</span>
            </div>

            <button
              className="refresh-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        {activePage === "Dashboard" && (
          <>
            <section className="page-heading">
              <div>
                <h1>Dashboard Overview</h1>
                <p>
                  Welcome to your GreenCity management dashboard.
                </p>
              </div>

              <span className="date-label">
                Live Overview
              </span>
            </section>

            <section className="stats-grid">
              {stats.map(item => {
                const Icon = item.icon;

                return (
                  <div
                    className={`stat-card ${item.color}`}
                    key={item.title}
                  >
                    <div className="stat-top">
                      <span>{item.title}</span>
                      <Icon size={22} />
                    </div>

                    <h2>{item.value}</h2>
                    <p>{item.description}</p>
                  </div>
                );
              })}
            </section>

            <section className="dashboard-grid">
              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Complaint Status</h3>
                    <p>Live database summary</p>
                  </div>

                  <button
                    className="refresh-btn"
                    onClick={loadComplaints}
                  >
                    <RefreshCw size={15} />
                    Refresh
                  </button>
                </div>

                <div className="status-list">
                  <div>
                    Pending <strong>{pending}</strong>
                  </div>

                  <div>
                    In Progress <strong>{progress}</strong>
                  </div>

                  <div>
                    Resolved <strong>{resolved}</strong>
                  </div>
                </div>

                <div className="progress">
                  <span
                    style={{
                      width: `${
                        complaints.length
                          ? (resolved / complaints.length) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>

                <p className="muted">
                  {complaints.length
                    ? Math.round(
                        (resolved / complaints.length) * 100
                      )
                    : 0}
                  % complaints resolved
                </p>
              </div>

              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Waste Management</h3>
                    <p>GreenCity services</p>
                  </div>

                  <Recycle size={22} />
                </div>

                <div className="service-list">
                  <div><Recycle /> Waste Collection</div>
                  <div><Truck /> Vehicle Management</div>
                  <div><MapPin /> Collection Locations</div>
                  <div><BarChart3 /> Reports & Analytics</div>
                </div>
              </div>
            </section>

            <section className="panel recent-panel">
              <div className="panel-heading">
                <div>
                  <h3>Recent Complaints</h3>
                  <p>Latest records from MySQL</p>
                </div>

                <button
                  className="refresh-btn"
                  onClick={() => setActivePage("Complaints")}
                >
                  View All
                </button>
              </div>

              {complaints.length === 0 ? (
                <p className="muted">
                  No complaints recorded yet.
                </p>
              ) : (
                <div className="table-wrap">
                  <table className="complaints-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Location</th>
                        <th>Category</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {complaints.slice(0, 5).map(item => (
                        <tr key={item.id}>
                          <td>#{item.id}</td>
                          <td>{item.name}</td>
                          <td>{item.location}</td>
                          <td>{item.category}</td>
                          <td>
                            <span className="complaint-status">
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {error && (
              <p className="error-message">{error}</p>
            )}
          </>
        )}

        {activePage === "Complaints" && <Complaints onChanged={loadComplaints} />}

        {activePage === "Vehicles" && <Vehicles />}

        {activePage === "Waste Collection" && (
          <WasteCollection />
        )}

        {activePage === "Collection Locations" && (
          <CollectionLocations />
        )}

        {activePage === "Reports & Analytics" && (
          <Reports />
        )}

        {activePage === "Users" && <Users />}

        {activePage === "Settings" && (
          <Settings onProfileUpdate={handleProfileUpdate} />
        )}

        <footer>
          © 2026 GreenCity · Smart Waste Management System
        </footer>
      </main>
    </div>
  );
}

export default App;
