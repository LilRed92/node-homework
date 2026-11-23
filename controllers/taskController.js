const prisma = require("../db/prisma");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

// 🔖 [VIDEO: Creating task with Prisma create and user scoping]
const create = async (req, res, next) => {
  const incomingBody = req.body ?? {};
  const { error, value } = taskSchema.validate(incomingBody);

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  let task = null;
  try {
    task = await prisma.task.create({
      data: {
        ...value,
        userId: global.user_id,
      },
      select: { title: true, isCompleted: true, id: true },
    });
  } catch (err) {
    return next(err);
  }

  return res.status(201).json(task);
};

// 🔖 [VIDEO: Listing tasks with Prisma findMany scoped to current user]
const index = async (req, res, next) => {
  try {
    // SELECT id, title FROM tasks WHERE user_id = $1
    const tasks = await prisma.task.findMany({
      where: {
        userId: global.user_id,
      },
      select: { title: true, isCompleted: true, id: true },
    });

    if (tasks.length === 0) {
      return res.status(404).json({ message: "No tasks found." });
    }

    return res.status(200).json(tasks);
  } catch (err) {
    return next(err);
  }
};

// 🔖 [VIDEO: Retrieving single task with Prisma findUnique using id and userId]
const show = async (req, res, next) => {
  const id = parseInt(req.params?.id, 10);

  if (!id) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  try {
    const task = await prisma.task.findUnique({
      where: {
        id,
        userId: global.user_id,
      },
      select: { title: true, isCompleted: true, id: true },
    });

    if (!task) {
      return res.status(404).json({ message: "The task was not found." });
    }

    return res.status(200).json(task);
  } catch (err) {
    return next(err);
  }
};

// 🔖 [VIDEO: Updating task with Prisma update and handling P2025 error]
const update = async (req, res, next) => {
  const incomingBody = req.body ?? {};
  const { error, value } = patchTaskSchema.validate(incomingBody);

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const id = parseInt(req.params?.id, 10);

  if (!id) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  try {
    const task = await prisma.task.update({
      data: value,
      where: {
        id,
        userId: global.user_id,
      },
      select: { title: true, isCompleted: true, id: true },
    });
    return res.status(200).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    } else {
      return next(err);
    }
  }
};

// 🔖 [VIDEO: Deleting task with Prisma delete and handling P2025 error]
const deleteTask = async (req, res, next) => {
  const id = parseInt(req.params?.id, 10);

  if (!id) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  try {
    const task = await prisma.task.delete({
      where: {
        id,
        userId: global.user_id,
      },
      select: { title: true, isCompleted: true, id: true },
    });

    return res.status(200).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    } else {
      return next(err);
    }
  }
};

module.exports = {
  create,
  index,
  show,
  update,
  deleteTask,
};
