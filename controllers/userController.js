const register = async (req, res) => {
  const { name, email, password } = req.body;

  global.users.push({ name, email, password });
  global.user_id = global.users[global.users.length - 1];

  res.status(201).json({ name, email });
};

const logon = async (req, res) => {
  const { email, password } = req.body;

  const match = global.users.find(
    (u) => u.email === email && u.password === password
  );

  if (!match) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  global.user_id = match;
  res.status(200).json({ name: match.name, email: match.email });
};

const logoff = async (req, res) => {
  global.user_id = null;
  res.status(200).json({ message: "Logged off successfully." });
};

module.exports = { register, logon, logoff };
