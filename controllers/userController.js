const crypto = require("crypto");
const util = require("util");
const { userSchema } = require("../validation/userSchema");

const scrypt = util.promisify(crypto.scrypt);

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

const register = async (req, res) => {
  const incomingBody = req.body ?? {};
  const { error, value } = userSchema.validate(incomingBody, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const hashedPassword = await hashPassword(value.password);
  const newUser = {
    email: value.email,
    name: value.name,
    hashedPassword,
  };

  global.users.push(newUser);
  global.user_id = newUser;

  return res.status(201).json({ name: newUser.name, email: newUser.email });
};

const logon = async (req, res) => {
  const incomingBody = req.body ?? {};
  const { email, password } = incomingBody;

  const user = global.users.find((u) => u.email === email);
  const goodCredentials =
    user && (await comparePassword(password, user.hashedPassword));

  if (!goodCredentials) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  global.user_id = user;
  return res.status(200).json({ name: user.name, email: user.email });
};

const logoff = async (req, res) => {
  global.user_id = null;
  return res.status(200).json({ message: "Logged off successfully." });
};

module.exports = { register, logon, logoff };
