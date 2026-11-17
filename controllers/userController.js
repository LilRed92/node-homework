const crypto = require("crypto");
const util = require("util");
const pool = require("../db/pg-pool");
const { userSchema } = require("../validation/userSchema");

const scrypt = util.promisify(crypto.scrypt);

// 🔖 [VIDEO: Password hashing with salt and scrypt]
// 🔖 [VIDEO: Password hashing with salt and scrypt]
const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
};

const comparePassword = async (inputPassword, storedHash) => {
  if (!storedHash || typeof storedHash !== "string") {
    return false;
  }

  const [salt, key] = storedHash.split(":");
  if (!salt || !key) {
    return false;
  }

  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
};

const register = async (req, res, next) => {
  const incomingBody = req.body ?? {};
  const { error, value } = userSchema.validate(incomingBody, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }

  try {
    // 🔖 [VIDEO: Hashing password during registration]
    const hashedPassword = await hashPassword(value.password);
    const result = await pool.query(
      `INSERT INTO users (email, name, hashed_password)
       VALUES ($1, $2, $3) RETURNING id, email, name`,
      [value.email, value.name, hashedPassword],
    );

    const user = result.rows[0];
    global.user_id = user.id;

    return res.status(201).json({ name: user.name, email: user.email });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ message: "Email is already registered." });
    }
    if (next) {
      return next(err);
    }
    return res.status(500).json({ error: err.message });
  }
};

const logon = async (req, res, next) => {
  const incomingBody = req.body ?? {};
  const { email, password } = incomingBody;

  try {
    const result = await pool.query(
      "SELECT id, name, email, hashed_password FROM users WHERE email = $1",
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = result.rows[0];
    // 🔖 [VIDEO: Comparing passwords during login]
    const passwordMatch = await comparePassword(password, user.hashed_password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    global.user_id = user.id;
    return res.status(200).json({ name: user.name, email: user.email });
  } catch (err) {
    if (next) {
      return next(err);
    }
    return res.status(500).json({ error: err.message });
  }
};

const logoff = async (req, res) => {
  global.user_id = null;
  return res.status(200).json({ message: "Logged off successfully." });
};

module.exports = { register, logon, logoff, hashPassword, comparePassword };
