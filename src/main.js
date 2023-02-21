const express = require("express");
const bodyParser = require("body-parser");
const { check, validationResult } = require("express-validator");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const port = process.env.PORT || 3000;
const db = new sqlite3.Database("./src/data/urls.db", (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to the urls database.");
});
db.run(`CREATE TABLE IF NOT EXISTS urls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL
)`);
function generateShortCode() {
  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const codeLength = 7;
  let code = "";
  for (let i = 0; i < codeLength; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.set("view engine", "ejs");
app.get("/", (req, res) => {
  res.render("index");
});
app.post("/shorten", (req, res) => {
  const longUrl = req.body.url;
  const code = generateShortCode();
  db.run(
    `INSERT INTO urls (code, url) VALUES (?, ?)`,
    [code, longUrl],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed: urls.code")) {
          return res.status(400).json({ error: "Code already exists" });
        }
        return res.status(500).json({ error: "Database error" });
      }
      const shortUrl = `${req.protocol}://${req.get("host")}/${code}`;
      res.json({ shortUrl });
    }
  );
});
app.get("/:code", (req, res) => {
  const code = req.params.code;
  db.get(`SELECT url FROM urls WHERE code = ?`, [code], (err, row) => {
    if (err || !row) {
      return res.status(404).send("Not found");
    }
    res.redirect(row.url);
  });
});
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
