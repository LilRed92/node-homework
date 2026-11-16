const pool = require("../db/pg-pool");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

// 🔖 [VIDEO: Joi validation returning error and value]
const create = async (req, res, next) => {
  const incomingBody = req.body ?? {};
  const { error, value } = taskSchema.validate(incomingBody);

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  try {
    // 🔖 [VIDEO: Using validated value instead of raw body]
    const result = await pool.query(
      `INSERT INTO tasks (title, is_completed, user_id)
       VALUES ($1, $2, $3)
       RETURNING id, title, is_completed`,
      [value.title, value.isCompleted, global.user_id],
    );

    const task = result.rows[0];
    return res.status(201).json(task);
  } catch (err) {
    if (next) {
      return next(err);
    }
    return res.status(500).json({ error: err.message });
  }
};

const index = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, title, is_completed FROM tasks WHERE user_id = $1",
      [global.user_id],
    );

    const tasks = result.rows;
    if (tasks.length === 0) {
      return res.status(404).json({ message: "No tasks found." });
    }

    return res.status(200).json(tasks);
  } catch (err) {
    if (next) {
      return next(err);
    }
    return res.status(500).json({ error: err.message });
  }
};

const show = async (req, res, next) => {
  const taskId = parseInt(req.params?.id, 10);

  if (!taskId) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  try {
    // 🔖 [VIDEO: Checking task ownership against user_id]
    const result = await pool.query(
      "SELECT id, title, is_completed FROM tasks WHERE id = $1 AND user_id = $2",
      [taskId, global.user_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    if (next) {
      return next(err);
    }
    return res.status(500).json({ error: err.message });
  }
};

const update = async (req, res, next) => {
  const incomingBody = req.body ?? {};
  const { error, value } = patchTaskSchema.validate(incomingBody);

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const taskId = parseInt(req.params?.id, 10);

  if (!taskId) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  try {
    const taskKeys = Object.keys(value).map((key) =>
      key === "isCompleted" ? "is_completed" : key,
    );
    const setClauses = taskKeys
      .map((key, i) => `${key} = $${i + 1}`)
      .join(", ");
    const idParm = `$${taskKeys.length + 1}`;
    const userParm = `$${taskKeys.length + 2}`;

    const result = await pool.query(
      `UPDATE tasks SET ${setClauses}
       WHERE id = ${idParm} AND user_id = ${userParm}
       RETURNING id, title, is_completed`,
      [...Object.values(value), taskId, global.user_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    if (next) {
      return next(err);
    }
    return res.status(500).json({ error: err.message });
  }
};

const deleteTask = async (req, res, next) => {
  const taskId = parseInt(req.params?.id, 10);

  if (!taskId) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id, title, is_completed",
      [taskId, global.user_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    if (next) {
      return next(err);
    }
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  create,
  index,
  show,
  update,
  deleteTask,
};
