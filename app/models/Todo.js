const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TodoSchema = new Schema({
  task: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 100,
    match: [/^[^<>]*$/, "Task cannot contain < or > characters."],
  },
  completed: {
    type: Boolean,
    default: false,
    index: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("todos", TodoSchema);
