import React, { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:8000";

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking backend...");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState({
    keyword: "technology",
    articles: 8,
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

  const sentimentLabel = (score) => {
    if (score > 0.1) return "Positive";
    if (score < -0.1) return "Negative";
    return "Neutral";
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
        throw new Error(body || "Backend error");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Unable to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    window.open(`${API_BASE}/download-csv`, "_blank");
  };

  return (
    <div className="app-shell">
      <div className="top-surface">
        <div>
          <p className="eyebrow">Strategic Intelligence</p>
          <h1>Real-Time Industry Insights Dashboard</h1>
          <p className="intro-text">
            Analyze global news sentiment, forecast trends, and trigger automated
            alerts from a modern intelligence control center.
          </p>
        </div>

        <div className="hero-actions">
          <button onClick={fetchNews} disabled={loading} className="btn btn-primary">
            {loading ? "Analyzing..." : "Run Analysis"}
          </button>
          <button onClick={downloadCsv} className="btn btn-secondary">
            Export Report
          </button>
        </div>
      </div>

      <div className="status-panel">
        <div>
          <span className="status-label">Backend status</span>
          <p>{backendStatus}</p>
        </div>
        <div className="status-pill">{loading ? "Fetching..." : "Idle"}</div>
      </div>

      <section className="query-panel">
        <form onSubmit={fetchNews} className="query-form">
          <div className="form-grid">
            <label>
              Keyword
              <input name="keyword" value={query.keyword} onChange={handleChange} required />
            </label>
            <label>
              Articles
              <input type="number" name="articles" min={1} max={20} value={query.articles} onChange={handleChange} />
            </label>
            <label>
              Start date
              <input type="date" name="start_date" value={query.start_date} onChange={handleChange} />
            </label>
            <label>
              End date
              <input type="date" name="end_date" value={query.end_date} onChange={handleChange} />
            </label>
            <label>
              Date mode
              <select name="date_mode" value={query.date_mode} onChange={handleChange}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </label>
          </div>
          <div className="query-submit">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Fetching insights..." : "Fetch News Sentiment"}
            </button>
          </div>
        </form>
      </section>

      {error && <div className="error-banner">{error}</div>}

      {result && (
        <>
          <section className="metric-grid">
            {Object.entries(result.kpis || {}).map(([label, value]) => (
              <div key={label} className="metric-card">
                <span className="metric-title">{label.replace(/_/g, " ")}</span>
                <strong>{typeof value === "number" ? value.toFixed(2) : String(value)}</strong>
              </div>
            ))}
          </section>

          <div className="details-grid">
            <div className="panel">
              <h2>Forecast</h2>
              {result.forecast_data?.length ? (
                <ul className="forecast-list">
                  {result.forecast_data.map((item, idx) => (
                    <li key={idx}>
                      <span>{item.date}</span>
                      <strong>{item.prediction}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Forecast data is not available yet.</p>
              )}
            </div>

            <div className="panel">
              <h2>Alerts</h2>
              <p className="muted">{result.alert_message || "No alerts triggered."}</p>
            </div>
          </div>

          <div className="article-panels">
            <div className="panel article-panel">
              <h2>Top Positive Articles</h2>
              <ul>
                {result.top_positive_articles?.map((article, idx) => (
                  <li key={idx}>
                    <a href={article.url} target="_blank" rel="noreferrer">
                      {article.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="panel article-panel">
              <h2>Top Negative Articles</h2>
              <ul>
                {result.top_negative_articles?.map((article, idx) => (
                  <li key={idx}>
                    <a href={article.url} target="_blank" rel="noreferrer">
                      {article.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
