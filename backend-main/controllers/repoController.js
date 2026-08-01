const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const Issue = require("../models/issueModel");

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function createRepository(req, res) {
  const { owner, name, issues, content, description, visibility } = req.body;

  try {
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Repository name is required!" });
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(name.trim())) {
      return res.status(400).json({ error: "Repository name can only contain letters, numbers, periods, hyphens, and underscores." });
    }

    if (!isValidObjectId(owner)) {
      return res.status(400).json({ error: "Invalid User ID!" });
    }

    const user = await User.findById(owner);
    if (!user) {
      return res.status(404).json({ error: "Owner not found!" });
    }

    const existingRepository = await Repository.findOne({ owner, name: name.trim() });
    if (existingRepository) {
      return res.status(409).json({ error: "You already have a repository with this name." });
    }

    const newRepository = new Repository({
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : "",
      visibility: Boolean(visibility),
      owner,
      content: Array.isArray(content) ? content : [],
      issues: Array.isArray(issues) ? issues : [],
    });

    const result = await newRepository.save();
    await User.findByIdAndUpdate(owner, { $addToSet: { repositories: result._id } });

    res.status(201).json({
      message: "Repository created!",
      repositoryID: result._id,
    });
  } catch (err) {
    console.error("Error during repository creation : ", err.message);
    res.status(500).send("Server error");
  }
}

async function getAllRepositories(req, res) {
  try {
    const repositories = await Repository.find({ visibility: true })
      .populate("owner")
      .populate("issues");

    const mapped = await Promise.all(
      repositories.map(async (repo) => {
        const starCount = await User.countDocuments({ starRepos: repo._id });
        const forkCount = await Repository.countDocuments({
          description: { $regex: new RegExp(`Forked from .*/${escapeRegex(repo.name)}`, "i") }
        });
        const obj = repo.toObject();
        obj.starCount = starCount;
        obj.forkCount = forkCount;
        return obj;
      })
    );

    res.json(mapped);
  } catch (err) {
    console.error("Error during fetching repositories : ", err.message);
    res.status(500).send("Server error");
  }
}

async function fetchRepositoryById(req, res) {
  const { id } = req.params;
  try {
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid repository ID!" });
    }

    const repository = await Repository.findById(id)
      .populate("owner")
      .populate("issues");

    if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
    }

    const starCount = await User.countDocuments({ starRepos: id });
    const forkCount = await Repository.countDocuments({
      description: { $regex: new RegExp(`Forked from .*/${escapeRegex(repository.name)}`, "i") }
    });

    const repoObj = repository.toObject();
    repoObj.starCount = starCount;
    repoObj.forkCount = forkCount;

    res.json([repoObj]);
  } catch (err) {
    console.error("Error during fetching repository : ", err.message);
    res.status(500).send("Server error");
  }
}

async function fetchRepositoryByName(req, res) {
  const { name } = req.params;
  try {
    const repository = await Repository.findOne({ name })
      .populate("owner")
      .populate("issues");

    if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
    }

    const starCount = await User.countDocuments({ starRepos: repository._id });
    const forkCount = await Repository.countDocuments({
      description: { $regex: new RegExp(`Forked from .*/${escapeRegex(repository.name)}`, "i") }
    });

    const repoObj = repository.toObject();
    repoObj.starCount = starCount;
    repoObj.forkCount = forkCount;

    res.json([repoObj]);
  } catch (err) {
    console.error("Error during fetching repository : ", err.message);
    res.status(500).send("Server error");
  }
}

async function fetchRepositoriesForCurrentUser(req, res) {
  const { userID } = req.params;

  try {
    if (!isValidObjectId(userID)) {
      return res.status(400).json({ error: "Invalid User ID!" });
    }

    const repositories = await Repository.find({ owner: userID }).sort({ updatedAt: -1 }).lean();
    res.json({ message: "Repositories found!", repositories: repositories || [] });
  } catch (err) {
    console.error("Error during fetching user repositories : ", err.message);
    res.status(500).send("Server error");
  }
}

async function updateRepositoryById(req, res) {
  const { id } = req.params;
  const { content, description } = req.body;

  try {
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid repository ID!" });
    }

    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
    }

    // Ownership check
    if (repository.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: "Forbidden: You do not own this repository." });
    }

    if (content !== undefined) repository.content.push(String(content));
    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({ error: "Description must be a string!" });
      }
      repository.description = description.trim();
    }

    const updatedRepository = await repository.save();

    res.json({
      message: "Repository updated successfully!",
      repository: updatedRepository,
    });
  } catch (err) {
    console.error("Error during updating repository : ", err.message);
    res.status(500).send("Server error");
  }
}

async function toggleVisibilityById(req, res) {
  const { id } = req.params;

  try {
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid repository ID!" });
    }

    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
    }

    // Ownership check
    if (repository.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: "Forbidden: You do not own this repository." });
    }

    repository.visibility = !repository.visibility;

    const updatedRepository = await repository.save();

    res.json({
      message: "Repository visibility toggled successfully!",
      repository: updatedRepository,
    });
  } catch (err) {
    console.error("Error during toggling visibility : ", err.message);
    res.status(500).send("Server error");
  }
}

async function deleteRepositoryById(req, res) {
  const { id } = req.params;
  try {
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid repository ID!" });
    }

    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
    }

    // Ownership check
    if (repository.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: "Forbidden: You do not own this repository." });
    }

    await repository.deleteOne();

    await User.findByIdAndUpdate(repository.owner, { $pull: { repositories: repository._id } });
    await User.updateMany({ starRepos: repository._id }, { $pull: { starRepos: repository._id } });
    await Issue.deleteMany({ repository: repository._id });

    res.json({ message: "Repository deleted successfully!" });
  } catch (err) {
    console.error("Error during deleting repository : ", err.message);
    res.status(500).send("Server error");
  }
}

async function toggleStarRepository(req, res) {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid repository ID!" });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid User ID!" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }

    const repo = await Repository.findById(id);
    if (!repo) {
      return res.status(404).json({ error: "Repository not found!" });
    }

    if (!user.starRepos) {
      user.starRepos = [];
    }

    const starIndex = user.starRepos.findIndex((repoId) => repoId.toString() === id);
    let starred = false;
    if (starIndex === -1) {
      user.starRepos.push(id);
      starred = true;
    } else {
      user.starRepos.splice(starIndex, 1);
    }

    await user.save();
    res.json({
      message: starred ? "Repository starred!" : "Repository unstarred!",
      starred,
    });
  } catch (err) {
    console.error("Error during toggling star : ", err.message);
    res.status(500).send("Server error");
  }
}

async function forkRepository(req, res) {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid repository ID!" });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid User ID!" });
    }

    const originalRepo = await Repository.findById(id).populate("owner");
    if (!originalRepo) {
      return res.status(404).json({ error: "Repository not found!" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }

    const existingRepo = await Repository.findOne({ owner: userId, name: `${originalRepo.name}-fork` });
    const forkedName = existingRepo 
      ? `${originalRepo.name}-fork-${Date.now().toString().slice(-4)}`
      : `${originalRepo.name}-fork`;

    const newRepository = new Repository({
      name: forkedName,
      description: `Forked from ${originalRepo.owner.username}/${originalRepo.name}. ${originalRepo.description || ""}`,
      visibility: originalRepo.visibility,
      owner: userId,
      content: originalRepo.content || [],
      issues: [],
    });

    const result = await newRepository.save();
    await User.findByIdAndUpdate(userId, { $addToSet: { repositories: result._id } });
    res.status(201).json({
      message: "Repository forked successfully!",
      repositoryID: result._id,
    });
  } catch (err) {
    console.error("Error during forking : ", err.message);
    res.status(500).send("Server error");
  }
}

module.exports = {
  createRepository,
  getAllRepositories,
  fetchRepositoryById,
  fetchRepositoryByName,
  fetchRepositoriesForCurrentUser,
  updateRepositoryById,
  toggleVisibilityById,
  deleteRepositoryById,
  toggleStarRepository,
  forkRepository,
};
