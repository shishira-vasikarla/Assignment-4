import { useMemo, useState } from "react";
import "./styles.css";

// Backend base URL (images are served from backend, not Vite)
const BACKEND_URL = "http://localhost:3000";

export default function App() {
  const [searchName, setSearchName] = useState("tom");
  const [uploadName, setUploadName] = useState("tom");
  const [file, setFile] = useState(null);

  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState({ type: "", text: "" });

  const normalizedSearch = useMemo(() => searchName.trim().toLowerCase(), [searchName]);
  const normalizedUpload = useMemo(() => uploadName.trim().toLowerCase(), [uploadName]);

  async function handleSearch() {
    setStatus({ type: "", text: "" });
    setImageUrl("");

    if (!normalizedSearch) {
      setStatus({ type: "error", text: "Enter a character name (example: tom, jerry, dog)." });
      return;
    }

    try {
      const res = await fetch(`/api/getImage?name=${encodeURIComponent(normalizedSearch)}`);
      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: "error", text: data.error || "Search failed." });
        return;
      }

      // Load image from backend static server + cache-bust
      setImageUrl(`${BACKEND_URL}/${data.file}?t=${Date.now()}`);
      setStatus({ type: "success", text: `Showing: ${data.file}` });
    } catch {
      setStatus({ type: "error", text: "Search error (is backend running on :3000?)" });
    }
  }

  async function handleUpload() {
    setStatus({ type: "", text: "" });

    if (!normalizedUpload) {
      setStatus({ type: "error", text: "Enter a character name to replace (example: tom)." });
      return;
    }
    if (!file) {
      setStatus({ type: "error", text: "Choose an image file first." });
      return;
    }

    const form = new FormData();
    form.append("image", file); // MUST match multer: upload.single("image")

    try {
      const res = await fetch(`/api/upload?name=${encodeURIComponent(normalizedUpload)}`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: "error", text: data.error || "Upload failed." });
        return;
      }

      setStatus({ type: "success", text: `✅ ${data.action} ${data.file}` });

      // If you uploaded for the same name you are searching, refresh the preview
      if (normalizedUpload === normalizedSearch) {
        setImageUrl(`${BACKEND_URL}/${data.file}?t=${Date.now()}`);
      }

      setFile(null);
    } catch {
      setStatus({ type: "error", text: "Upload error (is backend running on :3000?)" });
    }
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Character Image Manager</h1>
          <p className="subtitle">Search and replace images without restarting the server.</p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["tom", "jerry", "dog"].map((x) => (
            <span
              key={x}
              style={{
                fontSize: 12,
                padding: "6px 10px",
                border: "1px solid rgba(255,255,255,.10)",
                background: "rgba(255,255,255,.05)",
                borderRadius: 999,
                color: "#aab6e8",
              }}
            >
              {x}
            </span>
          ))}
        </div>
      </header>

      <main className="grid">
        <section className="card">
          <h2>1) Search Image</h2>
          <div className="row">
            <input
              className="input"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="tom"
            />
            <button className="btn" onClick={handleSearch}>
              Search
            </button>
          </div>

          <div className="preview">
            {imageUrl ? (
              <img className="img" src={imageUrl} alt="character" />
            ) : (
              <div className="placeholder">Search to preview the image here</div>
            )}
          </div>
        </section>

        <section className="card">
          <h2>2) Upload / Replace Image</h2>
          <p className="hint">
            Enter a character name (example: <b>tom</b>) and upload an image. The server will save it as{" "}
            <b>{`<name>.jpg`}</b> inside <code>backend/public</code> and overwrite if it already exists.
          </p>

          <div className="stack">
            <label className="hint">Character name</label>
            <input
              className="input"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              placeholder="tom"
            />

            <label className="hint">Choose image file</label>
            <input
              className="file"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            <button className="btn btnPrimary" onClick={handleUpload}>
              Upload & Replace
            </button>
          </div>
        </section>
      </main>

      {status.text && (
        <div className={`toast ${status.type === "error" ? "toastError" : "toastSuccess"}`}>
          {status.text}
        </div>
      )}

      <footer className="footer">
        Demo tip: Search <b>tom</b> → show current image → upload new Tom image → search <b>tom</b> again (no backend restart).
      </footer>
    </div>
  );
}
