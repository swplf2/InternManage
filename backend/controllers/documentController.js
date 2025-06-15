const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { validationResult } = require('express-validator');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    
    // Create uploads directory if it doesn't exist
    try {
      await fs.access(uploadPath);
    } catch {
      await fs.mkdir(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow specific file types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/rtf'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and RTF files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB default
  },
  fileFilter: fileFilter
});

// @desc    Upload document
// @route   POST /api/documents/upload
// @access  Private
const uploadDocument = async (req, res) => {
  try {
    upload.single('document')(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileInfo = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date(),
        uploadedBy: req.user.id
      };

      res.json({
        message: 'File uploaded successfully',
        file: fileInfo
      });
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Download document
// @route   GET /api/documents/download/:filename
// @access  Private
const downloadDocument = async (req, res) => {
  try {
    const { filename } = req.params;
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const filePath = path.join(uploadPath, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ message: 'File not found' });
    }

    // Get file stats
    const stats = await fs.stat(filePath);
    
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the file
    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:filename
// @access  Private
const deleteDocument = async (req, res) => {
  try {
    const { filename } = req.params;
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const filePath = path.join(uploadPath, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete the file
    await fs.unlink(filePath);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get document info
// @route   GET /api/documents/:filename/info
// @access  Private
const getDocumentInfo = async (req, res) => {
  try {
    const { filename } = req.params;
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const filePath = path.join(uploadPath, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ message: 'File not found' });
    }

    // Get file stats
    const stats = await fs.stat(filePath);
    
    const fileInfo = {
      filename: filename,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    };

    res.json(fileInfo);
  } catch (error) {
    console.error('Get document info error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload multiple documents
// @route   POST /api/documents/upload-multiple
// @access  Private
const uploadMultipleDocuments = async (req, res) => {
  try {
    upload.array('documents', 5)(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'One or more files are too large. Maximum size is 10MB per file.' });
        }
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const filesInfo = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date(),
        uploadedBy: req.user.id
      }));

      res.json({
        message: `${req.files.length} files uploaded successfully`,
        files: filesInfo
      });
    });
  } catch (error) {
    console.error('Upload multiple documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    List all documents (admin only)
// @route   GET /api/documents
// @access  Private (Admin)
const listDocuments = async (req, res) => {
  try {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    
    // Check if uploads directory exists
    try {
      await fs.access(uploadPath);
    } catch {
      return res.json({ documents: [] });
    }

    const files = await fs.readdir(uploadPath);
    const documents = [];

    for (const file of files) {
      try {
        const filePath = path.join(uploadPath, file);
        const stats = await fs.stat(filePath);
        
        documents.push({
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        });
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
      }
    }

    res.json({ documents });
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  uploadDocument,
  downloadDocument,
  deleteDocument,
  getDocumentInfo,
  uploadMultipleDocuments,
  listDocuments
};
