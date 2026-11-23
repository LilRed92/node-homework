const crypto = require("crypto");
const util = require("util");
const prisma = require("../db/prisma");
const { userSchema } = require("../validation/userSchema");

const scrypt = util.promisify(crypto.scrypt);

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

// 🔖 [VIDEO: User registration with Prisma create and P2002 error handling]
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

  // 🔖 [VIDEO: Hashing password during registration]
  value.hashedPassword = await hashPassword(value.password);
  delete value.password;
  const { name, email, hashedPassword } = value;

  let user = null;
  try {
    user = await prisma.user.create({
      data: { name, email, hashedPassword },
      select: { name: true, email: true, id: true },
    });
  } catch (err) {
    if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
      return res.status(400).json({ message: "Email is already registered." });
    } else {
      return next(err);
    }
  }

  global.user_id = user.id;
  return res.status(201).json({ name: user.name, email: user.email });
};

// 🔖 [VIDEO: User logon with Prisma findUnique and lowercased email]
const logon = async (req, res, next) => {
  const incomingBody = req.body ?? {};
  let { email, password } = incomingBody;

  if (!email || !password) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  email = email.toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // 🔖 [VIDEO: Comparing passwords during login]
    const passwordMatch = await comparePassword(password, user.hashedPassword);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    global.user_id = user.id;
    return res.status(200).json({ name: user.name, email: user.email });
  } catch (err) {
    return next(err);
  }
};

const logoff = async (req, res) => {
  global.user_id = null;
  return res.status(200).json({ message: "Logged off successfully." });
};

module.exports = { register, logon, logoff, hashPassword, comparePassword };
