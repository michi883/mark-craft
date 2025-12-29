const express = require('express');
const router = express.Router();
const { generateLogoConcepts } = require('../services/logoGenerator');
const { uploadSVG, generateFileName } = require('../services/storage');

/**
 * POST /api/logos/generate
 * Generate logo concepts from a product description
 */
router.post('/generate', async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || typeof description !== 'string') {
      return res.status(400).json({
        error: 'Description is required and must be a string',
      });
    }

    // Limit description length
    if (description.length > 500) {
      return res.status(400).json({
        error: 'Description must be 500 characters or less',
      });
    }

    const result = await generateLogoConcepts(description);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error generating logos:', error);
    res.status(500).json({
      error: 'Failed to generate logo concepts',
      details: error.message,
    });
  }
});

/**
 * POST /api/logos/export
 * Export a selected logo to InsForge storage
 */
router.post('/export', async (req, res) => {
  try {
    const { logo, conceptName } = req.body;

    if (!logo || !conceptName) {
      return res.status(400).json({
        error: 'Logo SVG content and concept name are required',
      });
    }

    // Check if InsForge is configured
    if (!process.env.INSFORGE_STORAGE_KEY || !process.env.INSFORGE_STORAGE_URL) {
      return res.status(500).json({
        error: 'Storage service not configured',
      });
    }

    const fileName = generateFileName(conceptName);
    const result = await uploadSVG(fileName, logo);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error exporting logo:', error);
    res.status(500).json({
      error: 'Failed to export logo',
      details: error.message,
    });
  }
});

module.exports = router;
