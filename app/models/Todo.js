const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TodoSchema = new Schema({
    task: {
        type: String,
        required: true,
        index: true
    },
    created_at: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = Todo = mongoose.model('todos', TodoSchema);