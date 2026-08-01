const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const userRouter = express.Router();

userRouter.post("/signup", userController.signup);
userRouter.post("/login", userController.login);
userRouter.post("/logout", userController.logout);

// Protected routes
userRouter.get("/me", authMiddleware, userController.getMe);
userRouter.get("/allUsers", authMiddleware, userController.getAllUsers);
userRouter.get("/userProfile/:id", authMiddleware, userController.getUserProfile);
userRouter.put("/updateProfile/:id", authMiddleware, userController.updateUserProfile);
userRouter.delete("/deleteProfile/:id", authMiddleware, userController.deleteUserProfile);

module.exports = userRouter;
