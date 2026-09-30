const Task = require('../models/Task');
const { validationResult } = require('express-validator');

exports.createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, dueDate, priority, category, status } = req.body;
    const userId = req.user.uid;

    const taskData = {
      userId,
      title,
      description: description || '',
      dueDate: dueDate || null,
      priority: priority || 'Medium',
      category: category || 'General',
      status: status || 'Pending'
    };

    const task = await Task.create(taskData);
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to create task' 
    });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { status } = req.query;
    let tasks = await Task.findAll(userId);

    if (status && status !== 'All') {
      tasks = tasks.filter(t => t.status === status);
    }

    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to get tasks' 
    });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const task = await Task.findById(id, userId);
    
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }
    
    res.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to get task' 
    });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const updateData = req.body;

    // Allow partial updates (e.g. status only)
    const task = await Task.update(id, userId, updateData);
    res.json({
      success: true,
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to update task' 
    });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    
    const result = await Task.delete(id, userId);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to delete task' 
    });
  }
};
