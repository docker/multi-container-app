const express = require("express");
const Todo = require("./../models/Todo");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// Home page route
router.get("/", async (req, res) => {
  const todos = await Todo.find();
  res.render("todos", {
    tasks: Object.keys(todos).length > 0 ? todos : {},
  });
});

// Health endpoint for probes and CI smoke tests
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// POST - Submit Task
router.post(
  "/",
  [
    body("task")
      .trim()
      .notEmpty()
      .withMessage("Task cannot be empty")
      .isLength({ min: 1, max: 100 })
      .withMessage("Task must be between 1 and 100 characters")
      .matches(/^[^<>]*$/)
      .withMessage("Task cannot contain < or > characters")
      .escape(), // HTML escape for XSS protection
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const newTask = new Todo({
      task: req.body.task,
    });

    try {
      await newTask.save();
      res.redirect("/");
    } catch (err) {
      console.error(err);
      res.status(500).send("Failed to create task.");
    }
  }
);

// POST - Destroy todo item
router.post(
  "/todo/destroy",
  [
    body("_key")
      .trim()
      .notEmpty()
      .withMessage("Task ID is required")
      .isMongoId()
      .withMessage("Invalid task ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const taskKey = req.body._key;
      await Todo.findOneAndRemove({ _id: taskKey });
      res.redirect("/");
    } catch (err) {
      console.error(err);
      res.status(500).send("Failed to delete task.");
    }
  }
);

// POST - Edit todo item
router.post(
  "/todo/edit",
  [
    body("_key")
      .trim()
      .notEmpty()
      .withMessage("Task ID is required")
      .isMongoId()
      .withMessage("Invalid task ID"),
    body("task")
      .trim()
      .notEmpty()
      .withMessage("Task cannot be empty")
      .isLength({ min: 1, max: 100 })
      .withMessage("Task must be between 1 and 100 characters")
      .matches(/^[^<>]*$/)
      .withMessage("Task cannot contain < or > characters")
      .escape(), // HTML escape for XSS protection
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const taskKey = req.body._key;
      const newTask = req.body.task;
      await Todo.findByIdAndUpdate(taskKey, { task: newTask });
      res.redirect("/");
    } catch (err) {
      console.error(err);
      res.status(500).send("Failed to update task.");
    }
  }
);

// POST - Toggle completion status
router.post(
  "/todo/toggle",
  [
    body("_key")
      .trim()
      .notEmpty()
      .withMessage("Task ID is required")
      .isMongoId()
      .withMessage("Invalid task ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const taskKey = req.body._key;
      const todo = await Todo.findById(taskKey);

      if (!todo) {
        return res.status(404).send("Todo not found");
      }

      todo.completed = !todo.completed;
      await todo.save();
      res.redirect("/");
    } catch (err) {
      console.error(err);
      res.status(500).send("An error occurred while toggling the todo item");
    }
  }
);

// POST - Clear all completed tasks
router.post("/todo/clear-completed", async (req, res) => {
  try {
    await Todo.deleteMany({ completed: true });
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while clearing completed tasks");
  }
});

module.exports = router;
