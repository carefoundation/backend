const Blog = require('../models/Blog');
const User = require('../models/User');
const { processFileFields, deleteS3FilesFromObject } = require('../utils/fileHelper');

exports.createBlog = async (req, res) => {
  try {
    const { 
      title, 
      slug,
      content, 
      excerpt, 
      image, 
      category, 
      tags,
      status,
      metaTitle,
      metaDescription,
      focusKeywords,
      ogImage,
      publishedAt
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Please provide required fields: title and content'
      });
    }

    // Process and upload files to S3
    const processedData = await processFileFields({
      image,
      ogImage,
    }, ['image', 'ogImage']);

    const blog = await Blog.create({
      title,
      slug: slug || null,
      content,
      excerpt: excerpt || null,
      image: processedData.image || null,
      category: category || null,
      tags: tags || [],
      status: status || 'draft',
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      focusKeywords: focusKeywords || [],
      ogImage: processedData.ogImage || null,
      publishedAt: publishedAt ? new Date(publishedAt) : (status === 'published' ? new Date() : null),
      author: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: blog
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAllBlogs = async (req, res) => {
  try {
    const { status, category } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;

    const blogs = await Blog.find(query)
      .populate('author', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name email');

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found'
      });
    }

    blog.views += 1;
    await blog.save();

    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found'
      });
    }

    // Delete old files from S3 if new ones are being uploaded
    const fieldsToCheck = ['image', 'ogImage'];
    const oldFiles = {};
    fieldsToCheck.forEach(field => {
      if (req.body[field] !== undefined && blog[field]) {
        oldFiles[field] = blog[field];
      }
    });

    // Process and upload new files to S3
    const processedData = await processFileFields(req.body, ['image', 'ogImage']);

    // Delete old files from S3
    if (Object.keys(oldFiles).length > 0) {
      await deleteS3FilesFromObject(oldFiles);
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      processedData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedBlog
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found'
      });
    }

    // Delete files from S3 before deleting blog
    await deleteS3FilesFromObject(blog);

    await Blog.findByIdAndDelete(req.params.id);

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

