const express = require('express');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const Todo = require('./../models/Todo');

const router = express.Router();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

const redirectHome = (res) => res.redirect('/');

// Home page route
router.get('/', limiter, async (req, res) => {
    try {
        const todos = await Todo.find();

        return res.render('todos', {
            tasks: (Array.isArray(todos) && todos.length > 0 ? todos : {})
        });
    } catch (err) {
        console.error('Error loading todos:', err);

        return res.render('todos', {
            tasks: {}
        });
    }
});

// POST - Submit Task
router.post('/', limiter, async (req, res) => {
    const task = req.body && typeof req.body.task === 'string' ? req.body.task.trim() : '';

    if (!task) {
        console.warn('Missing todo task in create request');
        return redirectHome(res);
    }

    try {
        await Todo.create({ task });
    } catch (err) {
        console.error('Error creating todo:', err);
    }

    return redirectHome(res);
});

// POST - Destroy todo item
router.post('/todo/destroy', limiter, async (req, res) => {
    const taskKey = req.body && req.body._key;

    if (!mongoose.isValidObjectId(taskKey)) {
        console.warn('Invalid or missing todo id for deletion');
        return redirectHome(res);
    }

    try {
        const deletedTodo = await Todo.findByIdAndDelete(taskKey);

        if (!deletedTodo) {
            console.warn('Todo not found for deletion');
        }
    } catch (err) {
        console.error('Error deleting todo:', err);
    }

    return redirectHome(res);
});

module.exports = router;
