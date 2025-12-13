const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// 1) Serve static files from /public (images available at http://localhost:3000/tom.jpg)
app.use(express.static(path.join(__dirname, "public")));

// 2) GET /api/getImage?name=tom  -> returns the image filename if it exists
app.get("/api/getImage", (req, res) => {
  const name = (req.query.name || "").toLowerCase().trim();

  if (!name) {
    return res.status(400).json({ error: "Missing ?name= parameter" });
  }

  // Assignment requires fixed filename: <name>.jpg
  const fileName = `${name}.jpg`;
  const filePath = path.join(__dirname, "public", fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Image not found" });
  }

  res.json({ file: fileName });
});

// 3) Multer temp folder setup
const tempDir = path.join(__dirname, "temp_uploads");
fs.mkdirSync(tempDir, { recursive: true });

const upload = multer({
  dest: tempDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB safety limit
});

// 4) POST /api/upload?name=tom  (form-data field: image)
// Upload overwrites /public/<name>.jpg
app.post("/api/upload", upload.single("image"), (req, res) => {
  const name = (req.query.name || "").toLowerCase().trim();

  if (!name) {
    return res.status(400).json({ error: "Missing ?name= parameter" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded. Field must be 'image'." });
  }

  // Optional: ensure it's an image
  if (!req.file.mimetype || !req.file.mimetype.startsWith("image/")) {
    try {
      fs.unlinkSync(req.file.path);
    } catch {}
    return res.status(400).json({ error: "Uploaded file must be an image." });
  }

  const fixedFileName = `${name}.jpg`;
  const destPath = path.join(__dirname, "public", fixedFileName);

  // ✅ Determine if this is a new upload or a replacement
  const existedBefore = fs.existsSync(destPath);

  try {
    // Overwrite old file by moving temp file to /public
    fs.renameSync(req.file.path, destPath);

    return res.json({
      action: existedBefore ? "replaced" : "uploaded",
      file: fixedFileName,
    });
  } catch (err) {
    console.error(err);
    try {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    } catch {}
    return res.status(500).json({ error: "Upload failed" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
