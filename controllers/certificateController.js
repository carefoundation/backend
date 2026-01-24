const Certificate = require('../models/Certificate');
const Volunteer = require('../models/Volunteer');
const Event = require('../models/Event');

const generateCertificateNumber = () => {
  return 'CERT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

exports.createCertificate = async (req, res) => {
  try {
    const { volunteerId, eventId, title, description, certificateImage, hours } = req.body;

    if (!volunteerId || !title) {
      return res.status(400).json({
        success: false,
        error: 'Please provide required fields: volunteerId and title'
      });
    }

    const certificate = await Certificate.create({
      volunteerId,
      eventId: eventId || null,
      certificateNumber: generateCertificateNumber(),
      title,
      description: description || null,
      certificateImage: certificateImage || null,
      issuedBy: req.user._id,
      hours: hours || 0,
      status: 'issued',
    });

    await Volunteer.findByIdAndUpdate(volunteerId, {
      $push: { certificates: certificate._id }
    });

    res.status(201).json({
      success: true,
      message: 'Certificate created successfully',
      data: certificate
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAllCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find()
      .populate('volunteerId', 'name email')
      .populate('eventId', 'title')
      .populate('issuedBy', 'name email')
      .sort({ issuedDate: -1 });

    res.status(200).json({
      success: true,
      count: certificates.length,
      data: certificates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getCertificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('volunteerId', 'name email phone')
      .populate('eventId', 'title location')
      .populate('issuedBy', 'name email');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found'
      });
    }

    res.status(200).json({
      success: true,
      data: certificate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getMyCertificates = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id });

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        error: 'Volunteer profile not found'
      });
    }

    const certificates = await Certificate.find({ volunteerId: volunteer._id })
      .populate('eventId', 'title location')
      .populate('issuedBy', 'name email')
      .sort({ issuedDate: -1 });

    res.status(200).json({
      success: true,
      count: certificates.length,
      data: certificates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.updateCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found'
      });
    }

    res.status(200).json({
      success: true,
      data: certificate
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.deleteCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findByIdAndDelete(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found'
      });
    }

    await Volunteer.findByIdAndUpdate(certificate.volunteerId, {
      $pull: { certificates: certificate._id }
    });

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

