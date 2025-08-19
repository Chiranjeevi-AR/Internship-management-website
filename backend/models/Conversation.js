 const mongoose = require('mongoose');

    const conversationSchema = new mongoose.Schema({
        projectAssignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProjectAssignment',
            required: true,
            unique: true // Each project assignment has only one conversation
        },
        participants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    }, { timestamps: true });

    module.exports = mongoose.model('Conversation', conversationSchema);