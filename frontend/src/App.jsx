import { useMemo, useState } from "react";
import "./styles.css";

const allowed = ["tom", "jerry", "dog"];

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
      setStatus({ type: "error", text: "Enter a character name (tom/jerry/dog)." });
      return;
    }

    try {
      const res = await fetch(`/api/getImage?name=${encodeURIComponent(normalizedSearch)}`);
      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: "error", text: data.error || "Search failed." });
        return;
      }

      // IMPORTANT: cache-bust so new uploads show immediately
      setImageUrl(`/${data.file}?t=${Date.now()}`);
      setStatus({ type: "success", text: `Showing: ${data.file}` });
    } catch {
      setStatus({ type: "error", text: "Search error (is backend running on :3000?)" });
    }
  }

  async function handleUpload() {
    setStatus({ type: "", text: "" });

    if (!normalizedUpload) {
      setStatus({ type: "error", text: "Enter a character name to replace." });
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

      setStatus({ type: "success", text: `✅ Upload successful: replaced ${data.file}` });

      // Optional auto refresh if you replaced the currently searched character
      if (normalizedUpload === normalizedSearch) {
        setImageUrl(`/${data.file}?t=${Date.now()}`);
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
          {allowed.map((x) => (
            <span key={x} style={{
              fontSize: 12, padding: "6px 10px",
              border: "1px solid rgba(255,255,255,.10)",
              background: "rgba(255,255,255,.05)",
              borderRadius: 999, color: "#aab6e8"
            }}>{x}</span>
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
            <button className="btn" onClick={handleSearch}>Search</button>
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
            Upload a new file to overwrite <b>tom.jpg</b>, <b>jerry.jpg</b>, or <b>dog.jpg</b> in the backend <code>/public</code>.
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
