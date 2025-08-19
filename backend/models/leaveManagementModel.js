const mongoose = require('mongoose');

const leaveManagementSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    comment: {
        type: String
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },
    company: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Add company field from user before saving
leaveManagementSchema.pre('save', async function(next) {
    if (!this.company) {
        try {
            const User = mongoose.model('User');
            const user = await User.findById(this.userId);
            if (user) {
                this.company = user.company;
            }
        } catch (error) {
            console.error('Error getting user company:', error);
        }
    }
    next();
});

module.exports = mongoose.model('LeaveManagement', leaveManagementSchema);
