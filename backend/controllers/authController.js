const jwt = require('jsonwebtoken');
const {
	signupSchema,
	signinSchema,
	acceptCodeSchema,
	changePasswordSchema,
	acceptFPCodeSchema,
} = require('../middlewares/validator');
const User = require('../models/usersModel');
const Application = require('../models/applicationModel');
const Internship = require('../models/internshipsModel');
const { doHash, doHashValidation, hmacProcess } = require('../utils/hashing');
const transport = require('../middlewares/sendMail');

exports.signup = async (req, res) => {
	try {
		const { error, value } = signupSchema.validate(req.body);

		if (error) {
			return res
				.status(401)
				.json({ success: false, message: error.details[0].message });
		}
		const existingUser = await User.findOne({ email: value.email });

		if (existingUser) {
			return res
				.status(401)
				.json({ success: false, message: 'User already exists!' });
		}

		const hashedPassword = await doHash(value.password, 12);

		const userData = {
			name: value.name, // Explicitly setting the name
			email: value.email,
			password: hashedPassword,
			type: value.type,
		};

		// Add company field for roles that require it
		if (['intern', 'developer', 'hr'].includes(value.type)) {
			userData.company = value.company;
		}

		const newUser = new User(userData);
		const result = await newUser.save();
		result.password = undefined;

		// Different messages based on approval requirement
		let message = 'Your account has been created successfully';
		if (['intern', 'developer'].includes(value.type)) {
			message = 'Your account has been created successfully. Pending HR approval from your company.';
		} else if (value.type === 'hr') {
			message = 'Your account has been created successfully. Pending admin approval.';
		}

		res.status(201).json({
			success: true,
			message,
			result,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Server error occurred'
		});
	}
};

exports.signin = async (req, res) => {
	const { email, password } = req.body;
	try {
		const { error, value } = signinSchema.validate({ email, password });
		if (error) {
			return res
				.status(401)
				.json({ success: false, message: error.details[0].message });
		}

		const existingUser = await User.findOne({ email }).select('+password');
		if (!existingUser) {
			return res
				.status(401)
				.json({ success: false, message: 'User does not exists!' });
		}

		// check if intern period is over or not 
		if (existingUser.type === 'intern' && existingUser.endDate && new Date(existingUser.endDate) < new Date()) {
			existingUser.type = 'candidate';
			await existingUser.save();
		}

		const result = await doHashValidation(password, existingUser.password);
		if (!result) {
			return res
				.status(401)
				.json({ success: false, message: 'Invalid credentials!' });
		}
		
		// Check if user is approved for roles that require approval
		if (['intern', 'developer', 'hr'].includes(existingUser.type) && !existingUser.isApproved) {
			return res
				.status(403)
				.json({ success: false, message: 'Your account is pending approval. Please contact your administrator.' });
		}

		const token = jwt.sign(
			{
				userId: existingUser._id,
				email: existingUser.email,
				verified: existingUser.verified,
				type: existingUser.type,
				company: existingUser.company,
				isApproved: existingUser.isApproved,
			},
			process.env.TOKEN_SECRET,
			{
				expiresIn: '8h',
			}
		);

		res
			.cookie('Authorization', 'Bearer ' + token, {
				expires: new Date(Date.now() + 8 * 3600000),
				httpOnly: process.env.NODE_ENV === 'production',
				secure: process.env.NODE_ENV === 'production',
			})
			.json({
				success: true,
				token,
				type: existingUser.type,
				message: 'logged in successfully',
			});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Server error occurred during signin'
		});
	}
};

exports.signout = async (req, res) => {
	res
		.clearCookie('Authorization')
		.status(200)
		.json({ success: true, message: 'logged out successfully' });
};

exports.sendVerificationCode = async (req, res) => {
	const { email } = req.body;
	try {
		const existingUser = await User.findOne({ email });
		if (!existingUser) {
			return res
				.status(404)
				.json({ success: false, message: 'User does not exists!' });
		}
		if (existingUser.verified) {
			return res
				.status(400)
				.json({ success: false, message: 'You are already verified!' });
		}

		const codeValue = Math.floor(Math.random() * 1000000).toString();
		let info = await transport.sendMail({
			from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
			to: existingUser.email,
			subject: 'verification code',
			html: '<h1>' + codeValue + '</h1>',
		});

		if (info.accepted[0] === existingUser.email) {
			const hashedCodeValue = hmacProcess(
				codeValue,
				process.env.HMAC_VERIFICATION_CODE_SECRET
			);
			existingUser.verificationCode = hashedCodeValue;
			existingUser.verificationCodeValidation = Date.now();
			await existingUser.save();
			return res.status(200).json({ success: true, message: 'Code sent!' });
		}
		res.status(400).json({ success: false, message: 'Code sent failed!' });
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Server error occurred while sending verification code'
		});
	}
};

exports.verifyVerificationCode = async (req, res) => {
	const { email, providedCode } = req.body;
	try {
		const { error, value } = acceptCodeSchema.validate({ email, providedCode });
		if (error) {
			return res
				.status(401)
				.json({ success: false, message: error.details[0].message });
		}

		const codeValue = providedCode.toString();
		const existingUser = await User.findOne({ email }).select(
			'+verificationCode +verificationCodeValidation'
		);

		if (!existingUser) {
			return res
				.status(401)
				.json({ success: false, message: 'User does not exists!' });
		}
		if (existingUser.verified) {
			return res
				.status(400)
				.json({ success: false, message: 'you are already verified!' });
		}

		if (
			!existingUser.verificationCode ||
			!existingUser.verificationCodeValidation
		) {
			return res
				.status(400)
				.json({ success: false, message: 'something is wrong with the code!' });
		}

		if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
			return res
				.status(400)
				.json({ success: false, message: 'code has been expired!' });
		}

		const hashedCodeValue = hmacProcess(
			codeValue,
			process.env.HMAC_VERIFICATION_CODE_SECRET
		);

		if (hashedCodeValue === existingUser.verificationCode) {
			existingUser.verified = true;
			existingUser.verificationCode = undefined;
			existingUser.verificationCodeValidation = undefined;
			await existingUser.save();

			// Generate a new token with updated verification status
			const token = jwt.sign(
				{
					userId: existingUser._id,
					email: existingUser.email,
					verified: existingUser.verified,
					type: existingUser.type,
				},
				process.env.TOKEN_SECRET,
				{
					expiresIn: '8h',
				}
			);

			return res
				.status(200)
				.json({ 
					success: true, 
					message: 'your account has been verified!',
					token: token
				});
		}
		return res
			.status(400)
			.json({ success: false, message: 'unexpected occured!!' });
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Server error occurred during code verification'
		});
	}
};

exports.changePassword = async (req, res) => {
	const { userId, verified } = req.user;
	const { oldPassword, newPassword } = req.body;
	try {
		const { error, value } = changePasswordSchema.validate({
			oldPassword,
			newPassword,
		});
		if (error) {
			return res
				.status(401)
				.json({ success: false, message: error.details[0].message });
		}
		if (!verified) {
			return res
				.status(401)
				.json({ success: false, message: 'You are not verified user!' });
		}
		const existingUser = await User.findOne({ _id: userId }).select(
			'+password'
		);
		if (!existingUser) {
			return res
				.status(401)
				.json({ success: false, message: 'User does not exists!' });
		}
		const result = await doHashValidation(oldPassword, existingUser.password);
		if (!result) {
			return res
				.status(401)
				.json({ success: false, message: 'Invalid credentials!' });
		}
		const hashedPassword = await doHash(newPassword, 12);
		existingUser.password = hashedPassword;
		await existingUser.save();
		return res
			.status(200)
			.json({ success: true, message: 'Password updated!!' });
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Server error occurred during password change'
		});
	}
};

exports.sendForgotPasswordCode = async (req, res) => {
	const { email } = req.body;
	try {
		const existingUser = await User.findOne({ email });
		if (!existingUser) {
			return res
				.status(404)
				.json({ success: false, message: 'User does not exists!' });
		}

		const codeValue = Math.floor(Math.random() * 1000000).toString();
		let info = await transport.sendMail({
			from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
			to: existingUser.email,
			subject: 'Forgot password code',
			html: '<h1>' + codeValue + '</h1>',
		});

		if (info.accepted[0] === existingUser.email) {
			const hashedCodeValue = hmacProcess(
				codeValue,
				process.env.HMAC_VERIFICATION_CODE_SECRET
			);
			existingUser.forgotPasswordCode = hashedCodeValue;
			existingUser.forgotPasswordCodeValidation = Date.now();
			await existingUser.save();
			return res.status(200).json({ success: true, message: 'Code sent!' });
		}
		res.status(400).json({ success: false, message: 'Code sent failed!' });
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Server error occurred while sending forgot password code'
		});
	}
};

exports.verifyForgotPasswordCode = async (req, res) => {
	const { email, providedCode, newPassword } = req.body;
	try {
		const { error, value } = acceptFPCodeSchema.validate({
			email,
			providedCode,
			newPassword,
		});
		if (error) {
			return res
				.status(401)
				.json({ success: false, message: error.details[0].message });
		}

		const codeValue = providedCode.toString();
		const existingUser = await User.findOne({ email }).select(
			'+forgotPasswordCode +forgotPasswordCodeValidation'
		);

		if (!existingUser) {
			return res
				.status(401)
				.json({ success: false, message: 'User does not exists!' });
		}

		if (
			!existingUser.forgotPasswordCode ||
			!existingUser.forgotPasswordCodeValidation
		) {
			return res
				.status(400)
				.json({ success: false, message: 'something is wrong with the code!' });
		}

		if (
			Date.now() - existingUser.forgotPasswordCodeValidation >
			5 * 60 * 1000
		) {
			return res
				.status(400)
				.json({ success: false, message: 'code has been expired!' });
		}

		const hashedCodeValue = hmacProcess(
			codeValue,
			process.env.HMAC_VERIFICATION_CODE_SECRET
		);

		if (hashedCodeValue === existingUser.forgotPasswordCode) {
			const hashedPassword = await doHash(newPassword, 12);
			existingUser.password = hashedPassword;
			existingUser.forgotPasswordCode = undefined;
			existingUser.forgotPasswordCodeValidation = undefined;
			await existingUser.save();
			return res
				.status(200)
				.json({ success: true, message: 'Password updated!!' });
		}
		return res
			.status(400)
			.json({ success: false, message: 'unexpected occured!!' });
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Server error occurred during forgot password code verification'
		});
	}
};

exports.getCurrentUser = async (req, res) => {
    try {
        // The identifier middleware now correctly places the decoded token into req.user
        // and the token payload has a field named 'userId'
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized: User ID not found in token' 
            });
        }

        const user = await User.findById(req.user.userId).select('-password -verificationCode -verificationCodeValidation -forgotPasswordCode -forgotPasswordCodeValidation');
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        let internshipDetails = null;
        if (user.type === 'intern') {
            // First try to find an approved application
            const application = await Application.findOne({ applicantId: user._id, status: 'approved' })
                .populate({
                    path: 'internshipId',
                    model: 'Internship',
                    select: 'company internshipStartDate internshipEndDate role'
                });

            if (application && application.internshipId) {
                internshipDetails = {
                    company: application.internshipId.company,
                    internshipStartDate: application.internshipId.internshipStartDate,
                    internshipEndDate: application.internshipId.internshipEndDate,
                    role: application.internshipId.role,
                };
            } else {
                // If no approved application found, try to find any application and get internship details
                const anyApplication = await Application.findOne({ applicantId: user._id })
                    .populate({
                        path: 'internshipId',
                        model: 'Internship',
                        select: 'company internshipStartDate internshipEndDate role'
                    });

                if (anyApplication && anyApplication.internshipId) {
                    internshipDetails = {
                        company: anyApplication.internshipId.company,
                        internshipStartDate: anyApplication.internshipId.internshipStartDate,
                        internshipEndDate: anyApplication.internshipId.internshipEndDate,
                        role: anyApplication.internshipId.role,
                        applicationStatus: anyApplication.status
                    };
                } else {
                    // If still no application found, try to find internship by company name
                    const internship = await Internship.findOne({ company: user.company });
                    if (internship) {
                        internshipDetails = {
                            company: internship.company,
                            internshipStartDate: internship.internshipStartDate,
                            internshipEndDate: internship.internshipEndDate,
                            role: internship.role,
                            applicationStatus: 'no_application'
                        };
                    }
                }
            }
        }

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                type: user.type,
                verified: user.verified,
                company: user.company || (internshipDetails ? internshipDetails.company : null),
                isApproved: user.isApproved,
                createdAt: user.createdAt,
                internshipDetails: internshipDetails
            }
        });
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while fetching user' 
        });
    }
};

exports.getPendingUsers = async (req, res) => {
	try {
		const { type, company } = req.user;
		
		// Check if user is verified
		if (!req.user.verified) {
			return res.status(403).json({
				success: false,
				message: 'Please verify your email before viewing pending users'
			});
		}
		
		// Only show users who are not approved AND have verified their email
		let query = { 
			isApproved: false,
			verified: true // Only show verified users in pending approvals
		};
		
		if (type === 'hr') {
			// HR can only see pending users from their company of type intern or developer
			query.company = company;
			query.type = { $in: ['intern', 'developer'] };
		} else if (type === 'admin') {
			// Admin can only see pending HR users
			query.type = 'hr';
		} else {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to view pending users'
			});
		}
		
		const pendingUsers = await User.find(query)
			.select('email type company createdAt verified')
			.sort({ createdAt: -1 });
		
		res.status(200).json({
			success: true,
			pendingUsers
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Server error occurred'
		});
	}
};

exports.approveUser = async (req, res) => {
	const { userId } = req.params; // Assuming userId is passed as a URL parameter
	const approver = req.user; // User performing the approval

	try {
		// Check if the approver has the necessary permissions
		if (approver.type !== 'admin' && approver.type !== 'hr') {
			return res
				.status(403)
				.json({ success: false, message: 'You are not authorized to approve users.' });
		}

		const userToApprove = await User.findById(userId);

		if (!userToApprove) {
			return res
				.status(404)
				.json({ success: false, message: 'User not found.' });
		}

		if (userToApprove.isApproved) {
			return res
				.status(400)
				.json({ success: false, message: 'User is already approved.' });
		}

		// Security check: Only allow approval of verified users
		if (!userToApprove.verified) {
			return res
				.status(400)
				.json({ 
					success: false, 
					message: 'Cannot approve user: User must verify their email address first.' 
				});
		}

		// Specific approval logic for HR users (must be approved by admin)
		if (userToApprove.type === 'hr' && approver.type !== 'admin') {
			return res
				.status(403)
				.json({ success: false, message: 'HR users can only be approved by an admin.' });
		}

		// Specific approval logic for intern/developer users (must be approved by HR of the same company)
		if (['intern', 'developer'].includes(userToApprove.type)) {
			if (approver.type !== 'hr') {
				return res
					.status(403)
					.json({ success: false, message: 'Intern and Developer users can only be approved by HR.' });
			}
			if (approver.company !== userToApprove.company) {
				return res
					.status(403)
					.json({ success: false, message: 'You can only approve users within your own company.' });
			}
		}


		userToApprove.isApproved = true;
		await userToApprove.save();

		// Send approval email
		try {
			const emailHtml = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
  <div style="background-color: #4A90E2; color: white; padding: 20px; text-align: center;">
    <h1 style="margin: 0; font-size: 24px;">Account Approved!</h1>
  </div>
  <div style="padding: 20px;">
    <p style="font-size: 18px;">Hello ${userToApprove.email},</p>
    <p>Great news! Your account on <strong>TallyIntern</strong> has been successfully approved.</p>
    <p>You can now log in and explore all the features and opportunities available to you. We're excited to have you as part of our community!</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || '#'}/login" style="background-color: #5cb85c; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;">Login to Your Account</a>
    </div>
    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
    <p>Welcome aboard!</p>
    <p>Best regards,<br>The TallyIntern Team</p>
  </div>
  <div style="background-color: #f7f7f7; color: #777; padding: 15px; text-align: center; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} TallyIntern. All rights reserved.</p>
  </div>
</div>`;

			await transport.sendMail({
				from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
				to: userToApprove.email,
				subject: 'Your TallyIntern Account is Approved!', // Updated subject
				html: emailHtml,
			});
		} catch (emailError) {
		}

		// Prepare the response, excluding sensitive data
		const userResponse = {
			_id: userToApprove._id,
			email: userToApprove.email,
			type: userToApprove.type,
			company: userToApprove.company,
			isApproved: userToApprove.isApproved
		};


		res.status(200).json({
			success: true,
			message: 'User approved successfully. Notification email sent.',
			user: userResponse,
		});
	} catch (error) {
		console.error('Error approving user:', error);
		res.status(500).json({
			success: false,
			message: 'Server error occurred during user approval.',
			error: error.message
		});
	}
};

exports.rejectUser = async (req, res) => {
	try {
		const { userId } = req.params;
		const { type, company } = req.user;
		
		// Check if user is verified
		if (!req.user.verified) {
			return res.status(403).json({
				success: false,
				message: 'Please verify your email before rejecting users'
			});
		}
		
		const userToReject = await User.findById(userId);
		
		if (!userToReject) {
			return res.status(404).json({
				success: false,
				message: 'User to reject not found'
			});
		}
		
		if (userToReject.isApproved) {
			return res.status(400).json({
				success: false,
				message: 'Cannot reject an already approved user. Consider a different action like suspend or remove.'
			});
		}
		
		// Security check: Only allow rejection of verified users (for consistency)
		if (!userToReject.verified) {
			return res.status(400).json({ 
				success: false, 
				message: 'Cannot reject user: User must verify their email address first. Unverified users will be automatically cleaned up.' 
			});
		}
		
		// Check authorization
		if (type === 'hr') {
			// HR can only reject interns and developers from their own company
			if (userToReject.company !== company || !['intern', 'developer'].includes(userToReject.type)) {
				return res.status(403).json({
					success: false,
					message: 'Forbidden: You can only reject interns and developers from your company.'
				});
			}
		} else if (type === 'admin') {
			// Admin can reject HR users or any other user type not covered by HR
			if (!['hr', 'intern', 'developer', 'candidate', 'non-tech', 'guide'].includes(userToReject.type)) { // Added more types admin might manage
                 return res.status(403).json({
                     success: false,
                     message: 'Forbidden: Admins cannot reject users of this type through this route or user type is unknown.'
                 });
            }
            // If admin is rejecting an HR, ensure they are not rejecting themselves if that's a rule.
            // if (userToReject.type === 'hr' && userToReject._id.toString() === req.user.userId) {
            // return res.status(400).json({ success: false, message: 'Admins cannot reject themselves.' });
            // }
		} else {
			return res.status(403).json({
				success: false,
				message: 'Forbidden: You do not have permission to reject users'
			});
		}
		
		await User.findByIdAndDelete(userId);
		
		// Optionally, send a notification email to the rejected user
		try {
			await transport.sendMail({
				from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
				to: userToReject.email,
				subject: 'Account Request Update - TallyIntern',
				html: `<h1>Account Request Rejected</h1>
					 <p>Hello ${userToReject.email},</p>
					 <p>We regret to inform you that your account request for TallyIntern has been rejected.</p>
					 <p>If you believe this is an error, please contact support.</p>
					 <p>Thank you,</p>
					 <p>The TallyIntern Team</p>`,
			});
		} catch (emailError) {
			console.error('Error sending rejection email:', emailError);
			// Do not fail the whole operation if email fails
		}
		
		res.status(200).json({
			success: true,
			message: 'User rejected and removed successfully'
		});
	} catch (error) {
		console.error('Error rejecting user:', error);
		res.status(500).json({
			success: false,
			message: 'Server error occurred'
		});
	}
};

exports.getCompanyAssignableUsers = async (req, res) => {
  try {
    const { company, verified: userIsVerified, type: userType } = req.user;

    if (!userIsVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before fetching assignable users.',
      });
    }

    // Authorization: Only HR and Admin should access this.
    if (!['hr', 'admin'].includes(userType)) {
        return res.status(403).json({
            success: false,
            message: 'Forbidden: You do not have permission to fetch these users.'
        });
    }

    const query = {
      isApproved: true, // Users must be approved
      verified: true,   // Users must be verified
      type: { $in: ['intern', 'developer'] }, // Only interns and developers (guides are developers)
    };

    // If the user is HR, they are restricted to their company.
    // If the user is Admin, they might see all or be restricted if they have a company affiliation.
    if (userType === 'hr') {
      if (!company) {
        return res.status(400).json({ success: false, message: 'HR user must be associated with a company.' });
      }
      query.company = company;
    } else if (userType === 'admin') {
      // If an admin is tied to a company (e.g. org admin promoted to super admin but still has company context)
      if (company) {
        query.company = company;
      }
      // If admin has no company field, query.company remains unset, fetching from all companies.
      // This allows a global admin to see all assignable users.
    }

    const assignableUsers = await User.find(query)
      .select('_id email name type company isApproved verified') // Select necessary fields
      .sort({ name: 1, email: 1 }); // Sort for easier selection in frontend

    res.status(200).json({
      success: true,
      data: assignableUsers,
    });

  } catch (error) {
    console.error('Error fetching company assignable users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching assignable users.',
    });
  }
};

// Refresh JWT token with updated user information
exports.refreshToken = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized: User ID not found in token' 
      });
    }

    const user = await User.findById(req.user.userId).select('-password -verificationCode -verificationCodeValidation -forgotPasswordCode -forgotPasswordCodeValidation');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Generate new JWT token with updated user information
    const newToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        type: user.type,
        verified: user.verified,
        isApproved: user.isApproved,
        company: user.company
      },
      process.env.TOKEN_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      token: newToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        type: user.type,
        company: user.company,
        verified: user.verified,
        isApproved: user.isApproved
      },
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while refreshing token.',
    });
  }
};

// Get all unique registered companies (for developer sign-up dropdown)
exports.getRegisteredCompanies = async (req, res) => {
  try {
    // Only companies with at least one approved HR or internship should be considered
    // We'll use users collection for now, filtering for HRs and developers
    const companies = await require('../models/usersModel').distinct('company', {
      company: { $ne: null, $ne: '' },
      type: { $in: ['hr', 'developer', 'intern'] },
      isApproved: true,
      verified: true
    });
    res.status(200).json({ success: true, companies });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch companies', error: error.message });
  }
};

// Get all companies from the Company collection (for dropdown)
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await require('../models/companyModel').find({}, 'name').sort({ name: 1 });
    res.status(200).json({ success: true, companies: companies.map(c => c.name) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch companies', error: error.message });
  }
};

// Admin: Register a new company
exports.registerCompany = async (req, res) => {
  try {
    // Only allow if user is admin
    if (!req.user || req.user.type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can register companies.' });
    }
    const { name, email } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Company name is required.' });
    const Company = require('../models/companyModel');
    const existing = await Company.findOne({ name });
    if (existing) return res.status(409).json({ success: false, message: 'Company already exists.' });
    const company = new Company({ name, email });
    await company.save();
    res.status(201).json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to register company', error: error.message });
  }
};
