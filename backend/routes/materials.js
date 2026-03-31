const router = require("express").Router();
const memoryStore = require("../lib/memoryStore");
const { requireAuth, requireAdmin } = require("../lib/auth");

router.get("/", async (_req, res) => {
  res.json(memoryStore.materials);
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const item = {
    id: Date.now().toString(),
    ...req.body,
  };

  memoryStore.materials.push(item);
  res.status(201).json(item);
});

module.exports = router;
