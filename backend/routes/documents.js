const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const {
  uploadDocument,
  downloadDocument,
  deleteDocument,
  getDocumentInfo,
  uploadMultipleDocuments,
  listDocuments
} = require('../controllers/documentController');

const router = express.Router();

// @route   POST /api/documents/upload
// @desc    Upload document
// @access  Private
router.post('/upload', auth, uploadDocument);

// @route   POST /api/documents/upload-multiple
// @desc    Upload multiple documents
// @access  Private
router.post('/upload-multiple', auth, uploadMultipleDocuments);

// @route   GET /api/documents
// @desc    List all documents (admin only)
// @access  Private (Admin)
router.get('/', auth, adminAuth, listDocuments);

// @route   GET /api/documents/download/:filename
// @desc    Download document
// @access  Private
router.get('/download/:filename', auth, downloadDocument);

// @route   GET /api/documents/:filename/info
// @desc    Get document info
// @access  Private
router.get('/:filename/info', auth, getDocumentInfo);

// @route   DELETE /api/documents/:filename
// @desc    Delete document
// @access  Private
router.delete('/:filename', auth, deleteDocument);

module.exports = router;
