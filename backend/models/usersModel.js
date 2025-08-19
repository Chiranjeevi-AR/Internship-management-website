const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Name is required!'],
			trim: true,
			minLength: [3, 'Name must have at least 3 characters!'],
		},
		email: {
			type: String,
			required: [true, 'Email is required!'],
			trim: true,
			unique: [true, 'Email must be unique!'],
			minLength: [5, 'Email must have 5 characters!'],
			lowercase: true,
		},
		password: {
			type: String,
			required: [true, 'Password must be provided!'],
			trim: true,
			select: false,
		},
		verified: {
			type: Boolean,
			default: false,
		},
		verificationCode: {
			type: String,
			select: false,
		},
		verificationCodeValidation: {
			type: Number,
			select: false,
		},
		forgotPasswordCode: {
			type: String,
			select: false,
		},
		forgotPasswordCodeValidation: {
			type: Number,
			select: false,
		},
		type: {
			type: String,
			enum: ['candidate', 'intern', 'developer', 'hr', 'admin'],
			required: [true, 'User type is required!'],
		},
		company: {
			type: String,
			required: function() {
				return ['intern', 'developer', 'hr'].includes(this.type);
			},
			trim: true,
		},
		isApproved: {
			type: Boolean,
			default: function() {
				// Auto-approve candidates and admins, others need approval
				return ['candidate', 'admin'].includes(this.type);
			},
		},
		approvedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		approvedAt: {
			type: Date,
		},
		endDate: {
			type: Date,
		},
		stipend: {
			amount: { type: Number },
			currency: { type: String, enum: ['INR', 'USD'] }
		},
		blacklistedByCompanies: [{ // New field
			type: String,
			trim: true,
		}],
		phone: {
			type: String,
			trim: true,
		},
		address: {
			type: String,
			trim: true,
		},
		linkedin: {
			type: String,
			trim: true,
		},
		github: {
			type: String,
			trim: true,
		},
		college: {
			type: String,
			trim: true,
		},
		branch: {
			type: String,
			trim: true,
		},
		profilePic: {
			type: String, // URL or filename
			trim: true,
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model('User', userSchema);
