const express = require('express');
const router = express.Router();
const controller = require('../controllers/taskController');
const { verifyToken } = require('../middleware/auth');
const { uploadSingle, handleUploadError } = require('../middleware/upload');

// Base path: /api/v1/tasks

router.use(verifyToken);

router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.put('/:id/complete', controller.markComplete);
router.put('/:id/reopen', controller.reopen);

// Comments
router.get('/:id/comments', controller.getComments);
router.post('/:id/comments', controller.addComment);

// Files
router.get('/:id/files', controller.getFiles);
router.post('/:id/files', uploadSingle('file'), handleUploadError, controller.uploadFile);

module.exports = router;

