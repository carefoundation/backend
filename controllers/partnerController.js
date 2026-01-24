const Partner = require('../models/Partner');
const User = require('../models/User');

exports.createPartner = async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      logo,
      photo,
      programs,
      impact,
      since,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      website,
      formData
    } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Please provide required fields: name and type'
      });
    }

    // Auto-generate description if not provided
    const finalDescription = description || `Partner: ${name}`;

    // Convert type to lowercase to match enum
    const typeLower = type.toLowerCase();
    if (!['health', 'food'].includes(typeLower)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid partner type. Must be "health" or "food"'
      });
    }

    // Extract images from formData if photo/logo are not provided
    let finalPhoto = photo;
    let finalLogo = logo;
    
    // Create a copy of formData to modify/sanitize
    let storedFormData = formData ? { ...formData } : null;
    
    if (formData) {
      // Check for banner image (most common)
      if (!finalPhoto && formData.banner) {
        finalPhoto = formData.banner;
      }
      // Check for clinic photos (first one)
      if (!finalPhoto && formData.clinicPhotos && Array.isArray(formData.clinicPhotos) && formData.clinicPhotos.length > 0) {
        finalPhoto = formData.clinicPhotos[0];
      }
      // Check for lab images (first one)
      if (!finalPhoto && formData.labImages && Array.isArray(formData.labImages) && formData.labImages.length > 0) {
        finalPhoto = formData.labImages[0];
      }
      // Check for hospital images (first one)
      if (!finalPhoto && formData.hospitalImages && Array.isArray(formData.hospitalImages) && formData.hospitalImages.length > 0) {
        finalPhoto = formData.hospitalImages[0];
      }
      // Check for pharmacy images (first one)
      if (!finalPhoto && formData.pharmacyImages && Array.isArray(formData.pharmacyImages) && formData.pharmacyImages.length > 0) {
        finalPhoto = formData.pharmacyImages[0];
      }
      // Check for restaurant images (first one)
      if (!finalPhoto && formData.restaurantImages && Array.isArray(formData.restaurantImages) && formData.restaurantImages.length > 0) {
        finalPhoto = formData.restaurantImages[0];
      }
      
      // Use photo as logo if logo is not provided
      if (!finalLogo && finalPhoto) {
        finalLogo = finalPhoto;
      }

      // Optimization: Remove redundant images from storedFormData to save space
      if (storedFormData) {
        if (storedFormData.banner === finalPhoto) {
            delete storedFormData.banner;
        }
        
        // Check total estimated size
        const totalSize = (finalPhoto ? finalPhoto.length : 0) + 
                          (finalLogo ? finalLogo.length : 0) + 
                          JSON.stringify(storedFormData).length;

        // MongoDB limit is 16MB. If we are close to the limit (e.g. > 10MB), strip extra images
        if (totalSize > 10 * 1024 * 1024) {
            // Remove all large image arrays from formData to ensure it saves
            delete storedFormData.banner;
            delete storedFormData.clinicPhotos;
            delete storedFormData.labImages;
            delete storedFormData.hospitalImages;
            delete storedFormData.pharmacyImages;
            delete storedFormData.restaurantImages;
            
            // Add a flag indicating images were truncated
            storedFormData._imagesTruncated = true;
        }
      }
    }

    const partner = await Partner.create({
      name,
      type: typeLower,
      description: finalDescription,
      logo: finalLogo || null,
      photo: finalPhoto || null,
      programs: programs || [],
      impact: impact || null,
      since: since || null,
      phone: phone || null,
      email: email ? email.toLowerCase() : null,
      address: address || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      website: website || null,
      formData: storedFormData || null,
      createdBy: req.user ? req.user._id : null,
      status: 'pending',
    });

    // Mark user's KYC as completed if user is logged in
    if (req.user && req.user.role === 'partner') {
      await User.findByIdAndUpdate(req.user._id, {
        partnerKycCompleted: true
      });
    }

    res.status(201).json({
      success: true,
      message: 'Partner request submitted successfully',
      data: partner
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAllPartners = async (req, res) => {
  try {
    const { type, status } = req.query;
    const query = {};

    // For non-admin users, only show approved partners
    if (!req.user || req.user.role !== 'admin') {
      query.status = 'approved';
    } else if (status) {
      query.status = status;
    }

    if (type) query.type = type;

    const partners = await Partner.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: partners.length,
      data: partners
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getPartnerById = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Partner not found'
      });
    }

    // For non-admin users, only allow viewing approved partners
    if (!req.user || req.user.role !== 'admin') {
      if (partner.status !== 'approved') {
        return res.status(403).json({
          success: false,
          error: 'Partner is not available'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: partner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getPartnersByType = async (req, res) => {
  try {
    const { type } = req.params;
    // Convert to lowercase to match enum values
    const typeLower = type.toLowerCase();
    const partners = await Partner.find({
      type: typeLower,
      status: 'approved'
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: partners.length,
      data: partners
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.updatePartner = async (req, res) => {
  try {
    const partner = await Partner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Partner not found'
      });
    }

    // If partner is approved and has a createdBy user, mark their KYC as completed
    if (partner.status === 'approved' && partner.createdBy) {
      await User.findByIdAndUpdate(partner.createdBy, {
        partnerKycCompleted: true
      });
    }

    res.status(200).json({
      success: true,
      data: partner
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.deletePartner = async (req, res) => {
  try {
    const partner = await Partner.findByIdAndDelete(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Partner not found'
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

exports.updatePartnerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'approved', 'rejected', 'active'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid status: pending, approved, rejected, or active'
      });
    }

    const partner = await Partner.findByIdAndUpdate(
      id,
      { status, updatedBy: req.user ? req.user._id : null },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Partner not found'
      });
    }

    // If partner is approved and has a createdBy user, mark their KYC as completed
    if ((status === 'approved' || status === 'active') && partner.createdBy) {
      await User.findByIdAndUpdate(partner.createdBy._id || partner.createdBy, {
        partnerKycCompleted: true
      });
    }

    res.status(200).json({
      success: true,
      message: `Partner ${status} successfully`,
      data: partner
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

