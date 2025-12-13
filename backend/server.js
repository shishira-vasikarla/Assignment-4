const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

const ALLOWED = new Set(["tom", "jerry", "dog"]);

app.get("/api/getImage", (req, res) => {
  const name = (req.query.name || "").toLowerCase().trim();
  if (!name) return res.status(400).json({ error: "Missing ?name= parameter" });
  if (!ALLOWED.has(name)) return res.status(400).json({ error: "Allowed: tom, jerry, dog" });

  const fileName = `${name}.jpg`;
  const filePath = path.join(__dirname, "public", fileName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Image not found" });

  res.json({ file: fileName });
});

const tempDir = path.join(__dirname, "temp_uploads");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

const upload = multer({ dest: tempDir });

app.post("/api/upload", upload.single("image"), (req, res) => {
  const name = (req.query.name || "").toLowerCase().trim();
  if (!name) return res.status(400).json({ error: "Missing ?name= parameter" });
  if (!ALLOWED.has(name)) return res.status(400).json({ error: "Allowed: tom, jerry, dog" });
  if (!req.file) return res.status(400).json({ error: "No file uploaded. Field must be 'image'." });

  const fixedFileName = `${name}.jpg`;
  const destPath = path.join(__dirname, "public", fixedFileName);

  fs.renameSync(req.file.path, destPath);
  res.json({ message: "Upload successful", file: fixedFileName });
});

// ✅ This must exist, or server exits immediately
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
