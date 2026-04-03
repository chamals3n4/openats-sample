import { useCallback, useEffect, useState } from "react";

function normBase(url) {
  return String(url || "")
    .trim()
    .replace(/\/$/, "");
}

function readPageOrigin() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export default function Playground() {
  const [pageOrigin] = useState(readPageOrigin);

  const [baseInput, setBaseInput] = useState(
    () => normBase(import.meta.env.VITE_OPENATS_URL) || "http://localhost:3000",
  );
  const [base, setBase] = useState(() => normBase(baseInput));

  const [jobs, setJobs] = useState([]);
  const [fetchStatus, setFetchStatus] = useState("idle");
  const [fetchError, setFetchError] = useState(null);

  const loadJobs = useCallback(async () => {
    const b = normBase(base);
    if (!b) return;
    setFetchStatus("loading");
    setFetchError(null);
    try {
      const res = await fetch(`${b}/api/public/jobs`, {
        headers: { Accept: "application/json" },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const list = Array.isArray(body.data) ? body.data : [];
      setJobs(list);
      setFetchStatus("ok");
    } catch (e) {
      setJobs([]);
      setFetchError(e instanceof Error ? e.message : "Request failed");
      setFetchStatus("error");
    }
  }, [base]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    const b = normBase(base);
    const root = document.getElementById("openats-jobs");
    if (!root || !b) return;

    root.innerHTML = "";
    const script = document.createElement("script");
    script.src = `${b}/embed.js`;
    script.async = true;
    script.setAttribute("data-instance", b);
    document.body.appendChild(script);

    return () => {
      script.remove();
      root.innerHTML = "";
    };
  }, [base]);

  function applyBase() {
    setBase(normBase(baseInput));
  }

  return (
    <div className="playground">
      <header className="playground__header">
        <h1>OpenATS origin test</h1>
        <p className="playground__intro">
          Vite app for testing allowed origins in OpenATS. This page’s origin is{" "}
          <code>{pageOrigin || "…"}</code>
          {pageOrigin ? " (from your current URL)" : null}. Add{" "}
          <strong>that same origin</strong> under{" "}
          <strong>Settings → Careers</strong> allowed origins, then set your
          OpenATS base URL below and <strong>Apply</strong>.
        </p>
        <div className="playground__base">
          <input
            type="url"
            value={baseInput}
            onChange={(e) => setBaseInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyBase()}
            placeholder="http://localhost:3000"
            aria-label="OpenATS app URL"
          />
          <button type="button" onClick={applyBase}>
            Apply
          </button>
        </div>
      </header>

      <div className="playground__grid">
        <section className="playground__panel">
          <h2>Fetch API</h2>
          <p className="playground__hint">
            <code>{base}/api/public/jobs</code>
          </p>
          <button
            type="button"
            className="playground__refresh"
            onClick={loadJobs}
            disabled={fetchStatus === "loading"}
          >
            {fetchStatus === "loading" ? "Loading…" : "Refresh"}
          </button>
          {fetchError ? (
            <p className="playground__error" role="alert">
              {fetchError}
            </p>
          ) : null}
          <ul className="playground__list">
            {jobs.map((j) => (
              <li key={j.id}>
                <a
                  className="playground__jobLink"
                  href={`${base}/careers/${encodeURIComponent(String(j.id))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <strong>{j.title}</strong>
                  {j.location ? (
                    <span className="playground__meta">{j.location}</span>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
          {!fetchError && fetchStatus === "ok" && jobs.length === 0 ? (
            <p className="playground__empty">No jobs returned.</p>
          ) : null}
        </section>

        <section className="playground__panel">
          <h2>Embed</h2>
          <p className="playground__hint">
            <code>{base}/embed.js</code> · <code>data-instance</code>
          </p>
          <div className="playground__embedHost" id="openats-jobs" />
        </section>
      </div>
    </div>
  );
}
