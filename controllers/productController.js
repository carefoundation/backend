const Product = require('../models/Product');
const User = require('../models/User');

exports.createProduct = async (req, res) => {
  try {
    const { name, description, image, images, price, category, stock } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        error: 'Please provide required fields: name and price'
      });
    }

    const product = await Product.create({
      name,
      description: description || null,
      image: image || null,
      images: images || [],
      price: parseFloat(price),
      category: category || null,
      stock: stock || 0,
      vendorId: req.user.role === 'vendor' ? req.user._id : null,
      status: 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const { category, status, vendorId } = req.query;
    const query = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (vendorId) query.vendorId = vendorId;

    const products = await Product.find(query)
      .populate('vendorId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('vendorId', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
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

