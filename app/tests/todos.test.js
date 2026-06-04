const request = require("supertest");

// Provide a lightweight in-memory mock for the Todo model so tests do not need
// to download MongoDB binaries (network access is restricted in CI).
jest.mock("../models/Todo", () => {
  const crypto = require("crypto");
  const store = [];

  const clone = (doc) => ({
    _id: doc._id,
    task: doc.task,
    completed: doc.completed,
    created_at: doc.created_at,
  });

  const matches = (doc, query = {}) =>
    Object.entries(query).every(([key, value]) => doc[key] === value);

  const generateObjectId = () => {
    const timestamp = Math.floor(Date.now() / 1000)
      .toString(16)
      .padStart(8, "0");
    const random = crypto.randomBytes(8).toString("hex");
    return (timestamp + random).slice(0, 24);
  };

  class MockTodo {
    constructor(data) {
      this._id = data._id || generateObjectId();
      this.task = data.task;
      this.completed = data.completed ?? false;
      this.created_at = data.created_at || new Date();
    }

    async save() {
      const snapshot = clone(this);
      const existing = store.findIndex((doc) => doc._id === this._id);
      if (existing === -1) store.push(snapshot);
      else store[existing] = snapshot;
      return this;
    }

    lean() {
      return clone(this);
    }

    static _reset() {
      store.length = 0;
    }

    static async create(data) {
      const doc = new MockTodo(data);
      await doc.save();
      return doc;
    }

    static find(query = {}) {
      const filtered = store.filter((doc) => matches(doc, query));
      const result = filtered.map((doc) => new MockTodo(doc));
      result.lean = () => filtered.map((doc) => clone(doc));
      return result;
    }

    static findOne(query) {
      const doc = store.find((item) => matches(item, query));
      return doc ? new MockTodo(doc) : null;
    }

    static findById(id) {
      const doc = store.find((item) => item._id === id);
      return doc ? new MockTodo(doc) : null;
    }

    static async findByIdAndUpdate(id, update) {
      const doc = MockTodo.findById(id);
      if (!doc) return null;
      if (update.task !== undefined) doc.task = update.task;
      if (update.completed !== undefined) doc.completed = update.completed;
      await doc.save();
      return doc;
    }

    static async findOneAndRemove(query) {
      const index = store.findIndex((item) => matches(item, query));
      if (index === -1) return null;
      const [removed] = store.splice(index, 1);
      return new MockTodo(removed);
    }

    static async deleteMany(filter) {
      let deletedCount = 0;
      for (let i = store.length - 1; i >= 0; i--) {
        if (matches(store[i], filter || {})) {
          store.splice(i, 1);
          deletedCount++;
        }
      }
      return { acknowledged: true, deletedCount };
    }
  }

  return MockTodo;
});

const Todo = require("../models/Todo");
const app = require("../server");

beforeEach(() => {
  Todo._reset();
});

describe("Todos CRUD (HTTP)", () => {
  test("creates a todo via POST /", async () => {
    const res = await request(app)
      .post("/")
      .type("form")
      .send({ task: "Buy milk" });

    expect(res.status).toBe(302);

    const todo = await Todo.findOne({ task: "Buy milk" }).lean();
    expect(todo).toBeTruthy();
    expect(todo.task).toBe("Buy milk");
    expect(todo.completed).toBe(false);
  });

  test("edits a todo via POST /todo/edit", async () => {
    const created = await Todo.create({ task: "Old task" });

    const res = await request(app)
      .post("/todo/edit")
      .type("form")
      .send({ _key: created._id.toString(), task: "New task" });

    expect(res.status).toBe(302);

    const updated = await Todo.findById(created._id).lean();
    expect(updated.task).toBe("New task");
  });

  test("toggles a todo via POST /todo/toggle", async () => {
    const created = await Todo.create({ task: "Toggle me" });

    const res = await request(app)
      .post("/todo/toggle")
      .type("form")
      .send({ _key: created._id.toString() });

    expect(res.status).toBe(302);

    const toggled = await Todo.findById(created._id).lean();
    expect(toggled.completed).toBe(true);
  });

  test("destroys a todo via POST /todo/destroy", async () => {
    const created = await Todo.create({ task: "Delete me" });

    const res = await request(app)
      .post("/todo/destroy")
      .type("form")
      .send({ _key: created._id.toString() });

    expect(res.status).toBe(302);

    const found = await Todo.findById(created._id);
    expect(found).toBeNull();
  });

  test("clears all completed tasks via POST /todo/clear-completed", async () => {
    // Create a mix of completed and incomplete tasks
    await Todo.create({ task: "Completed task 1", completed: true });
    await Todo.create({ task: "Incomplete task", completed: false });
    await Todo.create({ task: "Completed task 2", completed: true });

    const res = await request(app)
      .post("/todo/clear-completed")
      .type("form");

    expect(res.status).toBe(302);

    const remaining = await Todo.find().lean();
    expect(remaining.length).toBe(1);
    expect(remaining[0].task).toBe("Incomplete task");
    expect(remaining[0].completed).toBe(false);
  });
});
