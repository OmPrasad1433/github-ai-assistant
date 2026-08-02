const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
var ObjectId = require("mongodb").ObjectId;

dotenv.config();
const uri = process.env.MONGODB_URI;

let client;

function sanitizeUser(user) {
  if (!user) return user;
  const { password, ...safeUser } = user;
  return safeUser;
}

function isValidObjectId(id) {
  return ObjectId.isValid(id);
}

async function connectClient() {
  if (!client) {
    if (!uri) {
      throw new Error("MONGODB_URI is not configured");
    }
    client = new MongoClient(uri);
    await client.connect();
  }
}

async function signup(req, res) {
  const { username, password, email } = req.body;
  try {
    if (typeof username !== "string" || typeof email !== "string" || typeof password !== "string" || !username.trim() || !email.trim() || !password) {
      return res.status(400).json({ message: "Username, email, and password are required!" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    if (!process.env.JWT_SECRET_KEY || process.env.JWT_SECRET_KEY === "your_jwt_secret_key_here") {
      return res.status(500).json({ message: "JWT secret is not configured." });
    }

    await connectClient();
    const db = client.db();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      $or: [{ username: username.trim() }, { email: email.trim().toLowerCase() }],
    });
    if (user) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      username: username.trim(),
      password: hashedPassword,
      email: email.trim().toLowerCase(),
      repositories: [],
      followedUsers: [],
      starRepos: [],
    };

    const result = await usersCollection.insertOne(newUser);

    const token = jwt.sign(
      { id: result.insertedId },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 3600000, // 1 hour
    });

    res.json({ userId: result.insertedId });
  } catch (err) {
    console.error("Error during signup : ", err.message);
    res.status(500).send("Server error");
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  try {
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return res.status(400).json({ message: "Email and password are required!" });
    }

    if (!process.env.JWT_SECRET_KEY || process.env.JWT_SECRET_KEY === "your_jwt_secret_key_here") {
      return res.status(500).json({ message: "JWT secret is not configured." });
    }

    await connectClient();
    const db = client.db();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 3600000, // 1 hour
    });

    res.json({ userId: user._id });
  } catch (err) {
    console.error("Error during login : ", err.message);
    res.status(500).send("Server error!");
  }
}

async function logout(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.json({ message: "Successfully logged out" });
}

async function getMe(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    await connectClient();
    const db = client.db();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json({ user });
  } catch (err) {
    console.error("Error in getMe : ", err.message);
    res.status(500).send("Server error!");
  }
}

// NOTE: /allUsers is kept accessible to all authenticated users. Since no role system (Admin/User) exists,
// and users need to discover other users to use the 'follow' feature (followedUsers), all authenticated users
// are permitted to retrieve this list.
async function getAllUsers(req, res) {
  try {
    await connectClient();
    const db = client.db();
    const usersCollection = db.collection("users");

    const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray();
    res.json(users);
  } catch (err) {
    console.error("Error during fetching : ", err.message);
    res.status(500).send("Server error!");
  }
}

async function getUserProfile(req, res) {
  const currentID = req.params.id;

  try {
    if (!isValidObjectId(currentID)) {
      return res.status(400).json({ message: "Invalid user ID!" });
    }

    await connectClient();
    const db = client.db();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      _id: new ObjectId(currentID),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json(sanitizeUser(user));
  } catch (err) {
    console.error("Error during fetching : ", err.message);
    res.status(500).send("Server error!");
  }
}

async function updateUserProfile(req, res) {
  const currentID = req.params.id;
  const { email, password } = req.body;

  try {
    if (!isValidObjectId(currentID)) {
      return res.status(400).json({ message: "Invalid user ID!" });
    }

    // Check ownership: req.user.id must match the profile being updated
    if (req.user.id !== currentID) {
      return res.status(403).json({ message: "Forbidden: You cannot modify another user's profile." });
    }

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ message: "Email is required!" });
    }

    await connectClient();
    const db = client.db();
    const usersCollection = db.collection("users");

    let updateFields = { email: email.trim().toLowerCase() };
    if (password) {
      if (typeof password !== "string") {
        return res.status(400).json({ message: "Password must be a string." });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters." });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateFields.password = hashedPassword;
    }

    const result = await usersCollection.findOneAndUpdate(
      {
        _id: new ObjectId(currentID),
      },
      { $set: updateFields },
      { returnDocument: "after" }
    );
    const updatedUser = result?.value || result;
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json(sanitizeUser(updatedUser));
  } catch (err) {
    console.error("Error during updating : ", err.message);
    res.status(500).send("Server error!");
  }
}

async function deleteUserProfile(req, res) {
  const currentID = req.params.id;

  try {
    if (!isValidObjectId(currentID)) {
      return res.status(400).json({ message: "Invalid user ID!" });
    }

    // Check ownership: req.user.id must match the profile being deleted
    if (req.user.id !== currentID) {
      return res.status(403).json({ message: "Forbidden: You cannot delete another user's profile." });
    }

    await connectClient();
    const db = client.db();
    const usersCollection = db.collection("users");

    const result = await usersCollection.deleteOne({
      _id: new ObjectId(currentID),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Clear the token cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.json({ message: "User Profile Deleted!" });
  } catch (err) {
    console.error("Error during updating : ", err.message);
    res.status(500).send("Server error!");
  }
}

module.exports = {
  getAllUsers,
  signup,
  login,
  logout,
  getMe,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
};
