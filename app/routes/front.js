const express = require('express');
const Todo = require('./../models/Todo');

const router = express.Router();

// Home page route
router.get('/', async (req, res) => {
    const todos = await Todo.find().sort({ created_at: -1 }).lean();
    res.render('todos', {
        tasks: todos.length ? todos : []
    });
});

// POST - Submit Task
router.post('/', (req, res) => {
    const newTask = new Todo({
        task: req.body.task
    });

    newTask.save()
        .then(() => res.redirect('/'))
        .catch(err => console.log(err));
});

// POST - Destroy todo item
router.post('/todo/destroy', async (req, res) => {
    const taskKey = req.body._key;
    await Todo.findOneAndRemove({ _id: taskKey });
    res.redirect('/');
});

module.exports = router;