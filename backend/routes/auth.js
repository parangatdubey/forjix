const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const memoryStore = require("../lib/memoryStore");
const { signAuthToken, requireAuth } = require("../lib/auth");

const normalizeUsername = (value = "") => value.trim().toLowerCase();
const useMemoryDb = () => process.env.USE_MEMORY_DB === "true";
const usernamePattern = /^[a-z0-9]{4,24}$/;

const getStoredUser = async (username) =>
  useMemoryDb()
    ? memoryStore.users.get(username)
    : User.findOne({ username });

const sanitizeAccount = (user) => ({
  username: user.username,
  uid: user.uid || null,
  isAdmin: Boolean(user.isAdmin),
});

const validateCredentials = (username, password) => {
  if (!username || !password) {
    return "Username and password are required";
  }

  if (!usernamePattern.test(username)) {
    return "Username must be 4-24 lowercase letters or numbers";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }

  return null;
};

/* SIGNUP */
router.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    const normalizedUsername = normalizeUsername(username);
    const validationError = validateCredentials(normalizedUsername, password);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existingUser = await getStoredUser(normalizedUsername);
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    if (useMemoryDb()) {
      memoryStore.users.set(normalizedUsername, {
        username: normalizedUsername,
        password: hash,
        isAdmin: false,
        uid: null,
      });
    } else {
      await User.create({ username: normalizedUsername, password: hash, isAdmin: false });
    }

    const createdUser = await getStoredUser(normalizedUsername);
    const token = signAuthToken(createdUser);

    res.status(201).json({
      success: true,
      token,
      user: sanitizeAccount(createdUser),
    });
  } catch (error) {
    res.status(500).json({ message: "Signup failed" });
  }
});

/* LOGIN */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const normalizedUsername = normalizeUsername(username);
    const validationError = validateCredentials(normalizedUsername, password);
    const user = await getStoredUser(normalizedUsername);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "This account uses social login" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Wrong password" });
    }

    if (validationError && password.length < 8) {
      return res.status(400).json({ message: validationError });
    }

    res.json({
      success: true,
      token: signAuthToken(user),
      user: sanitizeAccount(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
});

router.post("/accounts", async (req, res) => {
  try {
    const { username, password, uid } = req.body;
    const normalizedUsername = normalizeUsername(username);

    if (!usernamePattern.test(normalizedUsername)) {
      return res.status(400).json({ message: "Username must be 4-24 lowercase letters or numbers" });
    }

    const existingUser = await getStoredUser(normalizedUsername);
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const payload = {
      username: normalizedUsername,
      uid: uid || undefined,
      isAdmin: false,
    };

    if (password) {
      payload.password = await bcrypt.hash(password, 10);
    }

    if (useMemoryDb()) {
      memoryStore.users.set(normalizedUsername, {
        username: normalizedUsername,
        password: payload.password || null,
        uid: payload.uid || null,
        isAdmin: payload.isAdmin,
      });
    } else {
      await User.create(payload);
    }

    const createdUser = await getStoredUser(normalizedUsername);
    res.status(201).json({
      success: true,
      token: signAuthToken(createdUser),
      user: sanitizeAccount(createdUser),
    });
  } catch (error) {
    res.status(500).json({ message: "Account creation failed" });
  }
});

router.post("/social-login", async (req, res) => {
  try {
    const normalizedUsername = normalizeUsername(req.body.username);
    const uid = (req.body.uid || "").trim();

    if (!usernamePattern.test(normalizedUsername) || !uid) {
      return res.status(400).json({ message: "Valid username and uid are required" });
    }

    let user = await getStoredUser(normalizedUsername);

    if (!user) {
      const payload = {
        username: normalizedUsername,
        uid,
        isAdmin: false,
      };

      if (useMemoryDb()) {
        memoryStore.users.set(normalizedUsername, payload);
      } else {
        await User.create(payload);
      }

      user = await getStoredUser(normalizedUsername);
    }

    if (user.uid && user.uid !== uid) {
      return res.status(401).json({ message: "Social account verification failed" });
    }

    if (!user.uid) {
      if (useMemoryDb()) {
        memoryStore.users.set(normalizedUsername, {
          ...user,
          uid,
        });
      } else {
        user.uid = uid;
        await user.save();
      }

      user = await getStoredUser(normalizedUsername);
    }

    res.json({
      success: true,
      token: signAuthToken(user),
      user: sanitizeAccount(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Social login failed" });
  }
});

router.get("/accounts/:username", async (req, res) => {
  try {
    const normalizedUsername = normalizeUsername(req.params.username);
    const user = await getStoredUser(normalizedUsername);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(sanitizeAccount(user));
  } catch (error) {
    res.status(500).json({ message: "Account lookup failed" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await getStoredUser(req.auth.sub);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(sanitizeAccount(user));
  } catch (error) {
    res.status(500).json({ message: "Account lookup failed" });
  }
});

module.exports = router;
