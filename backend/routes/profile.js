const router = require("express").Router();
const Profile = require("../models/Profile");
const memoryStore = require("../lib/memoryStore");
const { requireAuth } = require("../lib/auth");

const useMemoryDb = () => process.env.USE_MEMORY_DB === "true";
const normalizeUsername = (value = "") => value.trim().toLowerCase();

const canAccessProfile = (reqUsername, auth) =>
  auth?.isAdmin || auth?.sub === reqUsername;

/* SAVE / UPDATE PROFILE */
router.post("/:username", requireAuth, async (req, res) => {
  const username = normalizeUsername(req.params.username);

  if (!canAccessProfile(username, req.auth)) {
    return res.status(403).json({ message: "You cannot edit this profile" });
  }

  const payload = { ...req.body, username };

  if (useMemoryDb()) {
    memoryStore.profiles.set(username, payload);
  } else {
    await Profile.findOneAndUpdate(
      { username },
      payload,
      { upsert: true }
    );
  }

  res.json({ success: true });
});

/* GET PROFILE */
router.get("/:username", requireAuth, async (req, res) => {
  const username = normalizeUsername(req.params.username);

  if (!canAccessProfile(username, req.auth)) {
    return res.status(403).json({ message: "You cannot view this profile" });
  }

  const profile = useMemoryDb()
    ? memoryStore.profiles.get(username)
    : await Profile.findOne({ username });

  if (!profile) return res.sendStatus(404);
  res.json(profile);
});

module.exports = router;
