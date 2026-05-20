import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:8000";

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking backend...");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState({
    keyword: "technology",
    articles: 5,
    start_date: "",
    end_date: "",
    date_mode: "daily",
  });

  useEffect(() => {
    fetch(`${API_BASE}/`)
      .then((res) => res.json())
      .then((data) => setBackendStatus(data.message || "Backend connected."))
      .catch(() => setBackendStatus("Backend unavailable. Start FastAPI on port 8000."));
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setQuery((prev) => ({ ...prev, [name]: value }));
  };

  const fetchNews = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/fetch-news`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: query.keyword,
          articles: Number(query.articles),
          start_date: query.start_date || undefined,
          end_date: query.end_date || undefined,
          date_mode: query.date_mode,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Backend error: ${body}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Unable to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 24, fontFamily: "Inter, Arial, sans-serif" }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 36 }}>Real-Time Industry Insights</h1>
        <p style={{ color: "#555", marginTop: 8 }}>{backendStatus}</p>
      </header>

      <section style={{ marginBottom: 32, padding: 24, border: "1px solid #ddd", borderRadius: 12, background: "#fff" }}>
        <h2>Fetch latest news sentiment</h2>
        <form onSubmit={fetchNews} style={{ display: "grid", gap: 16, marginTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <label style={{ display: "grid", gap: 8 }}>
              Keyword
              <input
                name="keyword"
                value={query.keyword}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
              />
            </label>
            <label style={{ display: "grid", gap: 8 }}>
              Articles to fetch
              <input
                type="number"
                name="articles"
                min={1}
                max={20}
                value={query.articles}
                onChange={handleChange}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
              />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <label style={{ display: "grid", gap: 8 }}>
              Start date
              <input
                type="date"
                name="start_date"
                value={query.start_date}
                onChange={handleChange}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
              />
            </label>
            <label style={{ display: "grid", gap: 8 }}>
              End date
              <input
                type="date"
                name="end_date"
                value={query.end_date}
                onChange={handleChange}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
              />
            </label>
          </div>

          <label style={{ display: "grid", gap: 8, maxWidth: 240 }}>
            Date mode
            <select
              name="date_mode"
              value={query.date_mode}
              onChange={handleChange}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{ padding: "12px 20px", borderRadius: 10, border: "none", background: "#007bff", color: "white", cursor: "pointer", width: 160 }}
          >
            {loading ? "Loading..." : "Fetch News"}
          </button>
        </form>
      </section>

      {error && (
        <div style={{ marginBottom: 24, padding: 16, borderRadius: 10, background: "#ffe9e9", color: "#a00" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <section style={{ display: "grid", gap: 24, marginBottom: 32 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {Object.entries(result.kpis || {}).map(([label, value]) => (
              <div key={label} style={{ padding: 16, borderRadius: 12, background: "#fff", border: "1px solid #ddd" }}>
                <div style={{ fontSize: 14, color: "#777", textTransform: "capitalize" }}>{label.replace(/_/g, " ")}</div>
                <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>{typeof value === "number" ? value.toFixed(2) : String(value)}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: 16, borderRadius: 12, background: "#fff", border: "1px solid #ddd" }}>
            <h3 style={{ marginTop: 0 }}>Forecast</h3>
            {result.forecast_data && result.forecast_data.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {result.forecast_data.map((item, index) => (
                  <li key={index} style={{ marginBottom: 8 }}>
                    {item.date}: {item.prediction} ({item.lower}–{item.upper})
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, color: "#555" }}>Forecast data is not available yet.</p>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ padding: 16, borderRadius: 12, background: "#fff", border: "1px solid #ddd" }}>
              <h3 style={{ marginTop: 0 }}>Top Positive Articles</h3>
              {result.top_positive_articles?.length ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {result.top_positive_articles.map((item, index) => (
                    <li key={index}>
                      <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, color: "#555" }}>No positive articles available.</p>
              )}
            </div>

            <div style={{ padding: 16, borderRadius: 12, background: "#fff", border: "1px solid #ddd" }}>
              <h3 style={{ marginTop: 0 }}>Top Negative Articles</h3>
              {result.top_negative_articles?.length ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {result.top_negative_articles.map((item, index) => (
                    <li key={index}>
                      <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, color: "#555" }}>No negative articles available.</p>
              )}
            </div>
          </div>

          {result.alert_message && (
            <div style={{ padding: 16, borderRadius: 12, background: "#fff8e1", border: "1px solid #f0c14b" }}>
              <h3 style={{ marginTop: 0 }}>Alerts</h3>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "#333" }}>{result.alert_message}</pre>
            </div>
          )}
        </section>
      )}

      <footer style={{ color: "#777", fontSize: 14 }}>
        <p>Backend: {backendStatus}</p>
        <p>Use the form above to fetch news sentiment from the FastAPI backend.</p>
      </footer>
    </div>
  );
}

export default App;
