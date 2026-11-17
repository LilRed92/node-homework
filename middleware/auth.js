// 🔖 [VIDEO: Authentication guard (global.user_id)]
module.exports = (req, res, next) => {
  if (!global.user_id) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  next();
};
