const express = require("express");
const aiController = require("../controllers/aiController");

const aiRouter = express.Router();

aiRouter.post("/generate-readme", aiController.generateReadme);
aiRouter.post("/commit-message", aiController.generateCommitMessage);
aiRouter.post("/generate-description", aiController.generateRepositoryDescription);
aiRouter.post("/summarize-repo", aiController.summarizeRepository);
aiRouter.post("/chat", aiController.chatAssistant);

module.exports = aiRouter;
