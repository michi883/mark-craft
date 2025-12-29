const express = require('express');
const router = express.Router();
const { generateLogoConcepts, refineLogoConcept } = require('../services/logoGenerator');
const { uploadSVG, generateFileName } = require('../services/storage');

/**
 * POST /api/logos/generate
 * Generate logo concepts from a product description
 */
router.post('/generate', async (req, res) => {
  try {
    const { description } = req.body;

    console.log('Received request with description:', description);

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
    console.error('=== ERROR GENERATING LOGOS ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to generate logo concepts',
      details: error.message,
      stack: error.stack,
    });
  }
});

/**
 * POST /api/logos/refine
 * Refine a selected logo concept into a sophisticated, professional logo
 */
router.post('/refine', async (req, res) => {
  try {
    const { concept, description } = req.body;

    if (!concept || !description) {
      return res.status(400).json({
        error: 'Concept and description are required',
      });
    }

    console.log('Refining concept:', concept.name);

    const refinedLogo = await refineLogoConcept(concept, description);

    res.json({
      success: true,
      logo: refinedLogo,
    });
  } catch (error) {
    console.error('=== ERROR REFINING LOGO ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to refine logo',
      details: error.message,
      stack: error.stack,
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
