const FormSubmission = require('../models/FormSubmission');
const User = require('../models/User');

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
    const { replyMessage } = req.body;

    if (!replyMessage) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a reply message'
      });
    }

    const submission = await FormSubmission.findByIdAndUpdate(
      req.params.id,
      {
        replyMessage,
        repliedAt: new Date(),
        repliedBy: req.user._id,
        status: 'replied'
      },
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Form submission not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      data: submission
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

