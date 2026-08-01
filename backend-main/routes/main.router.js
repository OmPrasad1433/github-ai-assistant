const express = require("express");
const userRouter = require("./user.router");
const repoRouter = require("./repo.router");
const issueRouter = require("./issue.router");
const aiRouter = require("./ai.router");
const authMiddleware = require("../middleware/authMiddleware");

const mainRouter = express.Router();

mainRouter.use(userRouter);
mainRouter.use(authMiddleware, repoRouter);
mainRouter.use(authMiddleware, issueRouter);
mainRouter.use("/ai", authMiddleware, aiRouter);

mainRouter.get("/", (req, res) => {
  res.send("Welcome!");
});

module.exports = mainRouter;
