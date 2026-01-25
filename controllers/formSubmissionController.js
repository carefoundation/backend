const FormSubmission = require('../models/FormSubmission');
const User = require('../models/User');
const { sendReplyEmail } = require('../utils/emailService');

exports.createFormSubmission = async (req, res) => {
  try {
    const { formType, name, email, phone, subject, message, formData } = req.body;

    if (!formType || !name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide required fields: formType, name, and email'
      });
    }

    const submission = await FormSubmission.create({
      formType,
      name,
      email: email.toLowerCase(),
      phone: phone || null,
      subject: subject || null,
      message: message || null,
      formData: formData || {},
      status: 'new',
    });

    res.status(201).json({
      success: true,
      message: 'Form submitted successfully',
      data: submission
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAllSubmissions = async (req, res) => {
  try {
    const { formType, status } = req.query;
    const query = {};

    if (formType) query.formType = formType;
    if (status) query.status = status;

    const submissions = await FormSubmission.find(query)
      .populate('repliedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getSubmissionById = async (req, res) => {
  try {
    const submission = await FormSubmission.findById(req.params.id)
      .populate('repliedBy', 'name email');

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Form submission not found'
      });
    }

    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.updateSubmission = async (req, res) => {
  try {
    const submission = await FormSubmission.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Form submission not found'
      });
    }

    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.replyToSubmission = async (req, res) => {
  try {
    const { replyMessage, toEmail } = req.body;

    if (!replyMessage) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a reply message'
      });
    }

    // Get the submission first to get user details
    const submission = await FormSubmission.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Form submission not found'
      });
    }

    // Get admin user details
    const adminUser = await User.findById(req.user._id);
    const adminName = adminUser ? adminUser.name : 'Care Foundation Trust Team';

    // Use provided email or fallback to submission email
    const recipientEmail = toEmail || submission.email;

    // Update submission
    const updatedSubmission = await FormSubmission.findByIdAndUpdate(
      req.params.id,
      {
        replyMessage,
        repliedAt: new Date(),
        repliedBy: req.user._id,
        status: 'replied'
      },
      { new: true }
    );

    // Send email
    const emailResult = await sendReplyEmail(
      recipientEmail,
      submission.name,
      submission.subject,
      submission.message,
      replyMessage,
      adminName
    );

    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error || emailResult.message);
      // Still return success for the reply, but log the email error
    }

    res.status(200).json({
      success: true,
      message: emailResult.success ? 'Reply sent successfully via email' : 'Reply saved successfully (email sending failed)',
      data: updatedSubmission,
      emailSent: emailResult.success
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.deleteSubmission = async (req, res) => {
  try {
    const submission = await FormSubmission.findByIdAndDelete(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Form submission not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

