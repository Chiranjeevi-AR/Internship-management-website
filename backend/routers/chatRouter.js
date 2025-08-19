    const express = require('express');
    const router = express.Router();
    const chatController = require('../controllers/chatController');
    const { identifier } = require('../middlewares/identification');

    router.use(identifier);

    // Get all messages for a specific project assignment
    router.get('/:projectAssignmentId/messages', chatController.getMessages);

    module.exports = router;
    