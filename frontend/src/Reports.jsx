
import { useEffect, useState } from "react";
import { API_BASE_URL } from "./config";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import {
  RefreshCw,
  ClipboardList,
  Truck,
  Weight,
  AlertCircle
} from "lucide-react";

const API = `${API_BASE_URL}/reports/summary`;

const chartColors = ["#16a34a", "#2563eb", "#f59e0b", "#9333ea", "#ef4444", "#0891b2"];

function Reports() {
  const [data, setData] = useState({
    complaints: [],
    collections: [],
    wasteTypes: [],
    monthlyCollections: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API);

      if (!response.ok) {
        throw new Error("Unable to load reports from the server.");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const totalComplaints = data.complaints.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  const totalCollections = data.collections.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  const totalWaste = data.collections.reduce(
    (sum, item) => sum + Number(item.total_quantity || 0),
    0
  );

  const pendingComplaints = data.complaints
    .filter(item => item.status === "Pending")
    .reduce((sum, item) => sum + Number(item.total || 0), 0);

  const complaintChart = data.complaints.map(item => ({
    name: item.status,
    total: Number(item.total)
  }));

  const wasteChart = data.wasteTypes.map(item => ({
    name: item.waste_type || "Other",
    quantity: Number(item.total_quantity || 0)
  }));

  const monthlyChart = data.monthlyCollections.map(item => ({
    month: item.month,
    quantity: Number(item.total_quantity || 0)
  }));

  const cards = [
    {
      title: "Total Complaints",
      value: totalComplaints,
      icon: ClipboardList
    },
    {
      title: "Total Collections",
      value: totalCollections,
      icon: Truck
    },
    {
      title: "Waste Collected",
      value: `${totalWaste.toFixed(2)} kg`,
      icon: Weight
    },
    {
      title: "Pending Complaints",
      value: pendingComplaints,
      icon: AlertCircle
    }
  ];

  return (
    <div className="reports-page">
      <section className="page-heading">
        <div>
          <h1>Reports & Analytics</h1>
          <p>Monitor waste collection and complaint performance.</p>
        </div>

        <button
          className="refresh-btn"
          onClick={loadReports}
          type="button"
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh Reports
        </button>
      </section>

      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <p className="muted">Loading reports from MySQL...</p>
      ) : (
        <>
          <section className="report-cards">
            {cards.map((card, index) => {
              const Icon = card.icon;

              return (
                <div className="report-card" key={card.title}>
                  <div className="report-card-icon">
                    <Icon size={23} />
                  </div>
                  <div>
                    <p>{card.title}</p>
                    <h2>{card.value}</h2>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="report-charts">
            <div className="panel report-chart-panel">
              <div className="panel-heading">
                <div>
                  <h3>Complaints by Status</h3>
                  <p>Complaint distribution from MySQL.</p>
                </div>
              </div>

              {complaintChart.length === 0 ? (
                <p className="muted">No complaint data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={complaintChart}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {complaintChart.map((item, index) => (
                        <Cell
                          key={item.name}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="panel report-chart-panel">
              <div className="panel-heading">
                <div>
                  <h3>Waste by Type</h3>
                  <p>Total quantity collected by waste category.</p>
                </div>
              </div>

              {wasteChart.length === 0 ? (
                <p className="muted">No waste collection data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={wasteChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="quantity" fill="#16a34a" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="panel report-chart-panel report-wide">
              <div className="panel-heading">
                <div>
                  <h3>Monthly Waste Collection</h3>
                  <p>Waste collected over time in kilograms.</p>
                </div>
              </div>

              {monthlyChart.length === 0 ? (
                <p className="muted">No monthly collection data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="quantity"
                      name="Waste (kg)"
                      stroke="#2563eb"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Reports;
