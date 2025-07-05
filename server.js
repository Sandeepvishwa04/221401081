

const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");

const { logger, logMiddleware } = require("./logger");

const app = express();
app.use(bodyParser.json());
app.use(logMiddleware);
app.use(express.static("public"));

const SECRET = "affordmed_secret_key";
const USERS_FILE = "./users.json";

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");
  return JSON.parse(fs.readFileSync(USERS_FILE));
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// 🔐 Register API
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  const users = readUsers();

  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ error: "Email already registered" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user_id = Date.now().toString();
  const token = jwt.sign({ user_id }, SECRET, { expiresIn: "1h" });

  users.push({ user_id, name, email, password: hashed });
  writeUsers(users);

  res.json({ access_token: token, user_id });
});

// 🔑 Authenticate API
app.post("/api/authenticate", async (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();

  const user = users.find((u) => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Authentication failed" });
  }

  const token = jwt.sign({ user_id: user.user_id }, SECRET, { expiresIn: "1h" });
  res.json({ access_token: token, user_id: user.user_id });
});

// 📄 Log API
app.post("/api/log", (req, res) => {
  const { level, message, timestamp } = req.body;
  if (!["info", "warn", "error"].includes(level)) {
    return res.status(400).json({ error: "Invalid log level" });
  }

  logger.log({ level, message, timestamp });
  res.json({ status: "success" });
});

app.listen(3000, () => {
  console.log("✅ Affordmed backend running at http://localhost:3000");
});
