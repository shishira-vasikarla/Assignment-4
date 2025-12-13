const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Serve static images from /public
app.use(express.static(path.join(__dirname, "public")));

// Allowed names (matches assignment examples)
const ALLOWED = new Set(["tom", "jerry", "dog"]);

// GET /api/getImage?name=tom -> { file: "tom.jpg" }
app.get("/api/getImage", (req, res) => {
  const name = (req.query.name || "").toLowerCase().trim();

  if (!name) return res.status(400).json({ error: "Missing ?name= parameter" });
  if (!ALLOWED.has(name)) return res.status(400).json({ error: "Allowed: tom, jerry, dog" });

  const fileName = `${name}.jpg`;
  const filePath = path.join(__dirname, "public", fileName);

  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Image not found" });

  res.json({ file: fileName });
});

// Multer temp folder setup (safe even if folder already exists)
const tempDir = path.join(__dirname, "temp_uploads");
fs.mkdirSync(tempDir, { recursive: true });

// Multer config (optional: limit size to 5MB)
const upload = multer({
  dest: tempDir,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// POST /api/upload?name=tom (form-data field name must be "image")
app.post("/api/upload", upload.single("image"), (req, res) => {
  const name = (req.query.name || "").toLowerCase().trim();

  if (!name) return res.status(400).json({ error: "Missing ?name= parameter" });
  if (!ALLOWED.has(name)) return res.status(400).json({ error: "Allowed: tom, jerry, dog" });
  if (!req.file) return res.status(400).json({ error: "No file uploaded. Field must be 'image'." });

  // Optional safety: ensure uploaded file is an image
  // (Keeps assignment behavior, just prevents uploading non-images)
  if (!req.file.mimetype || !req.file.mimetype.startsWith("image/")) {
    try {
      fs.unlinkSync(req.file.path); // delete temp file
    } catch {}
    return res.status(400).json({ error: "Uploaded file must be an image." });
  }

  // Assignment requirement: fixed filename like tom.jpg, jerry.jpg, dog.jpg
  const fixedFileName = `${name}.jpg`;
  const destPath = path.join(__dirname, "public", fixedFileName);

  try {
    // Overwrite existing by moving temp file into /public
    fs.renameSync(req.file.path, destPath);
    res.json({ message: "Upload successful", file: fixedFileName });
  } catch (err) {
    console.error(err);
    // Clean up temp file if rename failed
    try {
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    } catch {}
    res.status(500).json({ error: "Upload failed" });
  }
});

// Start server (keep alive)
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
