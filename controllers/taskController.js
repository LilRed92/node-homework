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
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        userId: true,
      },
    });
  } catch (err) {
    return next(err);
  }

  return res.status(201).json(task);
};

// 🔖 [VIDEO: Listing tasks with eager loading, pagination, and search filter]
const index = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const whereClause = { userId: global.user_id };

    if (req.query.find) {
      whereClause.title = {
        contains: req.query.find,
        mode: "insensitive",
      };
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const totalTasks = await prisma.task.count({
      where: whereClause,
    });

    const pages = Math.ceil(totalTasks / limit) || 1;
    const hasNext = page * limit < totalTasks;
    const hasPrev = page > 1;

    const pagination = {
      page,
      limit,
      total: totalTasks,
      pages,
      hasNext,
      hasPrev,
    };

    return res.status(200).json({
      tasks,
      pagination,
    });
  } catch (err) {
    return next(err);
  }
};

// 🔖 [VIDEO: Retrieving single task with eager loading]
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
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        userId: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
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
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
      },
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

// 🔖 [VIDEO: Bulk task creation with validation and createMany]
const bulkCreate = async (req, res, next) => {
  const { tasks } = req.body;

  // Validate the tasks array
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: "Invalid request data. Expected an array of tasks.",
    });
  }

  // Validate all tasks before insertion
  const validTasks = [];
  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }
    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || "medium",
      userId: global.user_id,
    });
  }

  // Use createMany for batch insertion
  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false,
    });

    return res.status(201).json({
      message: "success!",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  create,
  index,
  show,
  update,
  deleteTask,
  bulkCreate,
};
