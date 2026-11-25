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

// 🔖 [VIDEO: User registration with Prisma transaction and welcome tasks]
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

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create user account (similar to Assignment 6, but using tx instead of prisma)
      const newUser = await tx.user.create({
        data: { email, name, hashedPassword },
        select: { id: true, email: true, name: true },
      });

      // Create 3 welcome tasks using createMany
      const welcomeTaskData = [
        { title: "Complete your profile", userId: newUser.id, priority: "medium" },
        { title: "Add your first task", userId: newUser.id, priority: "high" },
        { title: "Explore the app", userId: newUser.id, priority: "low" },
      ];
      await tx.task.createMany({ data: welcomeTaskData });

      // Fetch the created tasks to return them
      const welcomeTasks = await tx.task.findMany({
        where: {
          userId: newUser.id,
          title: { in: welcomeTaskData.map((t) => t.title) },
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          userId: true,
          priority: true,
        },
      });

      return { user: newUser, welcomeTasks };
    });

    // Store the user ID globally for session management (not secure for production)
    global.user_id = result.user.id;

    // Send response with status 201
    res.status(201);
    res.json({
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success",
    });
    return;
  } catch (err) {
    if (err.code === "P2002") {
      // send the appropriate error back -- the email was already registered
      return res.status(400).json({ error: "Email already registered" });
    } else {
      return next(err); // the error handler takes care of other errors
    }
  }
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
