const Joi = require('joi');

exports.signupSchema = Joi.object({
    name: Joi.string().min(3).max(60).required(),
	email: Joi.string()
		.min(6)
		.max(60)
		.required()
		.email({
			tlds: { allow: ['com', 'net'] },
		}),
	password: Joi.string()
		.required(),
	type: Joi.string()
		.valid('candidate', 'intern', 'developer', 'hr', 'admin')
		.required(),
	company: Joi.string()
		.min(2)
		.max(100)
		.when('type', {
			is: Joi.string().valid('intern', 'developer', 'hr'),
			then: Joi.required(),
			otherwise: Joi.forbidden()
		}),
});
exports.signinSchema = Joi.object({
	email: Joi.string()
		.min(6)
		.max(60)
		.required()
		.email({
			tlds: { allow: ['com', 'net'] },
		}),
	password: Joi.string()
		.required()
});

exports.acceptCodeSchema = Joi.object({
	email: Joi.string()
		.min(6)
		.max(60)
		.required()
		.email({
			tlds: { allow: ['com', 'net'] },
		}),
	providedCode: Joi.number().required(),
});

exports.changePasswordSchema = Joi.object({
	newPassword: Joi.string()
		.required(),
	oldPassword: Joi.string()
		.required()
});

exports.acceptFPCodeSchema = Joi.object({
	email: Joi.string()
		.min(6)
		.max(60)
		.required()
		.email({
			tlds: { allow: ['com', 'net'] },
		}),
	providedCode: Joi.number().required(),
	newPassword: Joi.string()
		.required()
});

exports.createPostSchema = Joi.object({
	title: Joi.string().min(3).max(60).required(),
	description: Joi.string().min(3).max(600).required(),
	userId: Joi.string().required(),
});

// Add internship schema
exports.internshipSchema = Joi.object({
	role: Joi.string().required(),
	company: Joi.string(),
	location: Joi.string().required(),
	duration: Joi.string(), // Will be calculated, no longer required
	type: Joi.string().required(),
	skills: Joi.array().items(Joi.string()),
	stipend: Joi.object({
        amount: Joi.number().min(0),
        currency: Joi.string().valid('INR', 'USD')
    }).optional(),
	expectedSalary: Joi.number(),
	eligibility: Joi.string(),
	openings: Joi.number(),
	jobDescription: Joi.string(),
	applyLink: Joi.string().uri(),
	internshipStartDate: Joi.date().required(),
    internshipEndDate: Joi.date().greater(Joi.ref('internshipStartDate')).required(),
});

// Add application schema validation
exports.applySchema = Joi.object({
	internshipId: Joi.string().required(),
	fullName: Joi.string().min(2).max(100).required(),
	address: Joi.string().min(10).max(500).required(),
	linkedinId: Joi.string().min(3).max(100).required(),
	githubId: Joi.string().min(3).max(100).required(),
	codingPlatformsId: Joi.string().max(200).optional(),
});

// Add project schema validation
exports.projectSchema = Joi.object({
	name: Joi.string().min(2).max(100).required(),
	company: Joi.string().min(2).max(100).required(),
	description: Joi.string().min(10).max(1000).required(),
	skillRequirement: Joi.array().items(Joi.string().min(1).max(50)).min(1).required(),
	estimatedTimeToComplete: Joi.string().min(2).max(100).required(),
	suggested_by: Joi.string().min(2).max(100).optional(),
	isApproved: Joi.boolean().optional(),
});

// Project assignment validation schemas
exports.volunteerSchema = Joi.object({
	projectId: Joi.string().required(),
});

exports.reviewVolunteerSchema = Joi.object({
	assignmentId: Joi.string().required(),
	userId: Joi.string().required(),
	userType: Joi.string().valid('developer', 'intern').required(),
	status: Joi.string().valid('pending', 'approved', 'rejected').required(),
});

exports.assignUserSchema = Joi.object({
	projectId: Joi.string().required(),
	userId: Joi.string().required(),
	userType: Joi.string().valid('developer', 'intern').required(),
});

exports.removeUserSchema = Joi.object({
	assignmentId: Joi.string().required(),
	userId: Joi.string().required(),
	userType: Joi.string().valid('developer', 'intern').required(),
});
exports.updateProjectSchema = Joi.object({
	projectId: Joi.string().required(),
	company: Joi.string().min(2).max(100).optional(),
	description: Joi.string().min(10).max(1000).optional(),
	skillRequirement: Joi.array().items(Joi.string().min(1).max(50)).min(1).optional(),
	estimatedTimeToComplete: Joi.string().min(2).max(100).optional(),
	suggested_by: Joi.string().min(2).max(100).optional(),
	isApproved: Joi.boolean().optional(),
});
exports.updateInternshipSchema = Joi.object({
	role: Joi.string().optional(),
	company: Joi.string().optional(),
	location: Joi.string().optional(),
	duration: Joi.string().optional(),
	type: Joi.string().optional(),
	skills: Joi.array().items(Joi.string()).optional(),
	stipend: Joi.object({
        amount: Joi.number().min(0).allow('', null),
        currency: Joi.string().valid('INR', 'USD')
    }).optional(),
	expectedSalary: Joi.number().optional(),
	eligibility: Joi.string().optional(),
	openings: Joi.number().optional(),
	jobDescription: Joi.string().optional(),
	applyLink: Joi.string().uri().optional(),
	internshipStartDate: Joi.date().optional(),
    internshipEndDate: Joi.date().greater(Joi.ref('internshipStartDate')).optional()
});
exports.updateApplicationSchema = Joi.object({
	applicationId: Joi.string().required(),
	status: Joi.string().valid('pending', 'approved', 'rejected').required(),
	reviewedBy: Joi.string().optional(),
	reviewedAt: Joi.date().optional(),
});
exports.notifyProjectMembersSchema = Joi.object({
	projectId: Joi.string().hex().length(24).required(),
	subject: Joi.string().min(5).max(100).optional(), // Optional custom subject
	message: Joi.string().min(10).max(1000).required() // Custom message body
});

exports.notifyAllProjectsMembersSchema = Joi.object({
  // No specific payload is now required from the client for this global notification.
  // Subject and message from req.body will be ignored by the controller.
});
