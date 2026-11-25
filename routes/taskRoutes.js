const express = require("express");
const {
  create,
  index,
  show,
  update,
  deleteTask,
  bulkCreate,
} = require("../controllers/taskController");

const router = express.Router();

router.get("/", index);
router.post("/", create);

// 🔖 [VIDEO: Bulk task creation route placed BEFORE parameterized /:id route]
router.post("/bulk", bulkCreate);

router.get("/:id", show);
router.patch("/:id", update);
router.delete("/:id", deleteTask);

module.exports = router;
