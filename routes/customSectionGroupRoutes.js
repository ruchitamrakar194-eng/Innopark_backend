// =====================================================
// Custom Section Group Routes
// =====================================================

const express = require('express');
const router = express.Router();
const customSectionGroupController = require('../controllers/customSectionGroupController');

// List all groups (optionally filter by entity)
router.get('/', customSectionGroupController.getAll);

// Get a single group by ID
router.get('/:id', customSectionGroupController.getById);

// Create a new group
router.post('/', customSectionGroupController.create);

// Update an existing group
router.put('/:id', customSectionGroupController.update);

// Delete a group
router.delete('/:id', customSectionGroupController.deleteGroup);

module.exports = router;
