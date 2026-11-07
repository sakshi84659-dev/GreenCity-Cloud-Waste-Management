
import { useState } from "react";
import { API_BASE_URL } from "./config";
import { User, Save, RefreshCw } from "lucide-react";

function Settings({ onProfileUpdate }) {
  const savedUser = JSON.parse(
    sessionStorage.getItem("greencity_user") || "{}"
  );

  const [name, setName] = useState(savedUser.name || "");
  const [email, setEmail] = useState(savedUser.email || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/users/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("greencity_token")}`
          },
          body: JSON.stringify({ name, email })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update profile.");
      }

      sessionStorage.setItem(
        "greencity_user",
        JSON.stringify(data.user)
      );

      setName(data.user.name);
      setEmail(data.user.email);
      onProfileUpdate(data.user);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const user = JSON.parse(
      sessionStorage.getItem("greencity_user") || "{}"
    );

    setName(user.name || "");
    setEmail(user.email || "");
    setMessage("");
    setError("");
  };

  return (
    <div className="settings-page">
      <section className="page-heading">
        <div>
          <h1>Settings</h1>
          <p>Manage your GreenCity account and preferences.</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3><User size={19} /> Admin Profile</h3>
            <p>Update your account information.</p>
          </div>
        </div>

        <form className="users-form" onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              required
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="Enter your name"
            />
          </label>

          <label>
            Email Address
            <input
              required
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="Enter your email"
            />
          </label>

          <div className="settings-actions">
            <button
              className="submit-btn"
              type="submit"
              disabled={loading}
            >
              <Save size={16} />
              {loading ? "Saving..." : "Save Changes"}
            </button>

            <button
              className="refresh-btn"
              type="button"
              onClick={resetForm}
            >
              <RefreshCw size={15} /> Reset
            </button>
          </div>
        </form>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </section>
    </div>
  );
}

export default Settings;
