/**
 * InsForge Storage Service
 * Handles uploading SVG files to InsForge S3-compatible storage
 */

const INSFORGE_STORAGE_KEY = process.env.INSFORGE_STORAGE_KEY;
const INSFORGE_STORAGE_URL = process.env.INSFORGE_STORAGE_URL;
const BUCKET_NAME = 'logos';

if (!INSFORGE_STORAGE_KEY || !INSFORGE_STORAGE_URL) {
  console.warn('InsForge credentials not found in environment variables');
}

/**
 * Upload SVG content to InsForge storage
 * @param {string} fileName - Name of the file (without .svg extension)
 * @param {string} svgContent - SVG content as string
 * @returns {Promise<Object>} - Upload result with URL
 */
async function uploadSVG(fileName, svgContent) {
  if (!INSFORGE_STORAGE_KEY || !INSFORGE_STORAGE_URL) {
    throw new Error('InsForge credentials not configured');
  }

  // Clean filename and ensure .svg extension
  const cleanName = fileName.replace(/[^a-zA-Z0-9-_]/g, '_');
  const key = `${cleanName}.svg`;

  // InsForge API format: PUT /api/storage/buckets/{bucketName}/objects/{objectKey}
  const uploadUrl = `${INSFORGE_STORAGE_URL}/api/storage/buckets/${BUCKET_NAME}/objects/${key}`;

  console.log('Uploading to InsForge:', uploadUrl);

  // Create FormData with the file
  const formData = new FormData();
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  formData.append('file', blob, key);

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${INSFORGE_STORAGE_KEY}`,
      // Don't set Content-Type - let fetch set it with the boundary
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('InsForge upload failed:', response.status, errorText);
    throw new Error(`Upload failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  console.log('Upload successful:', result);

  return {
    success: true,
    fileName: key,
    url: result.data?.url || result.url,
  };
}

/**
 * Generate a unique filename for a logo
 * @param {string} conceptName - Name of the logo concept
 * @returns {string} - Unique filename
 */
function generateFileName(conceptName) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const cleanName = conceptName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${cleanName}_${timestamp}_${random}`;
}

module.exports = {
  uploadSVG,
  generateFileName,
};
