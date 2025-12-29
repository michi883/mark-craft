// DOM Elements
const form = document.getElementById('descriptionForm');
const descriptionInput = document.getElementById('description');
const generateBtn = document.getElementById('generateBtn');
const btnText = generateBtn.querySelector('.btn-text');
const btnLoader = generateBtn.querySelector('.btn-loader');

const brandSection = document.getElementById('brandSection');
const keywordsEl = document.getElementById('keywords');
const toneEl = document.getElementById('tone');

const conceptsSection = document.getElementById('conceptsSection');
const conceptsGrid = document.getElementById('conceptsGrid');

const exportSuccess = document.getElementById('exportSuccess');
const exportUrl = document.getElementById('exportUrl');
const errorMessage = document.getElementById('errorMessage');

// Modal elements
const aboutBtn = document.getElementById('aboutBtn');
const aboutModal = document.getElementById('aboutModal');
const closeModal = document.getElementById('closeModal');

let currentLogos = [];
let currentDescription = '';
let refinedLogo = null;

// Event Listeners
form.addEventListener('submit', handleGenerate);

// About modal handlers
aboutBtn.addEventListener('click', () => {
  aboutModal.classList.add('active');
  document.body.style.overflow = 'hidden';
});

closeModal.addEventListener('click', () => {
  aboutModal.classList.remove('active');
  document.body.style.overflow = '';
});

// Close modal on overlay click
aboutModal.addEventListener('click', (e) => {
  if (e.target === aboutModal) {
    aboutModal.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && aboutModal.classList.contains('active')) {
    aboutModal.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// Hide messages on input
descriptionInput.addEventListener('input', () => {
  hideError();
  hideExportSuccess();
});

/**
 * Handle form submission to generate logos
 */
async function handleGenerate(e) {
  e.preventDefault();

  const description = descriptionInput.value.trim();
  if (!description) return;

  // Store description for refine call
  currentDescription = description;

  // Reset UI
  hideError();
  hideExportSuccess();
  brandSection.hidden = true;
  conceptsSection.hidden = true;
  conceptsGrid.innerHTML = '';
  currentLogos = [];
  refinedLogo = null;

  // Remove any existing refined logo card
  const existingRefined = conceptsGrid.querySelector('.refined-card');
  if (existingRefined) {
    existingRefined.remove();
  }

  // Set loading state
  setLoading(true);

  try {
    const response = await fetch('/api/logos/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate logos');
    }

    // Display results
    displayBrandAnalysis(data.keywords, data.tone);
    displayLogoConcepts(data.logos);
    currentLogos = data.logos;

  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
}

/**
 * Display brand analysis results
 */
function displayBrandAnalysis(keywords, tone) {
  keywordsEl.innerHTML = keywords
    .map(k => `<span class="keyword-tag">${escapeHtml(k)}</span>`)
    .join('');
  toneEl.textContent = tone;
  brandSection.hidden = false;
}

/**
 * Display logo concept cards
 */
function displayLogoConcepts(logos) {
  conceptsGrid.innerHTML = logos.map(logo => `
    <div class="concept-card" data-id="${logo.id}">
      <div class="concept-preview">
        ${logo.svg}
      </div>
      <div class="concept-name">${escapeHtml(logo.name)}</div>
      <div class="concept-description">${escapeHtml(logo.description)}</div>
      <div class="concept-actions">
        <button class="btn btn-primary select-btn" data-id="${logo.id}">
          Select
        </button>
      </div>
    </div>
  `).join('');

  // Add event listeners to Select buttons
  conceptsGrid.querySelectorAll('.select-btn').forEach(btn => {
    btn.addEventListener('click', () => refineConcept(btn.dataset.id));
  });

  conceptsSection.hidden = false;
}

/**
 * Refine a selected concept into a sophisticated logo
 */
async function refineConcept(id) {
  const concept = currentLogos.find(l => l.id === id);
  if (!concept) return;

  hideError();
  hideExportSuccess();

  // Remove any existing refined logo card before creating a new one
  const existingRefined = conceptsGrid.querySelector('.refined-card');
  if (existingRefined) {
    existingRefined.remove();
  }

  // Find the select button and set loading state
  const selectBtn = conceptsGrid.querySelector(`.select-btn[data-id="${id}"]`);
  const originalText = selectBtn.textContent;
  selectBtn.textContent = 'Refining...';
  selectBtn.disabled = true;

  try {
    const response = await fetch('/api/logos/refine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        concept: concept,
        description: currentDescription,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to refine logo');
    }

    // Store refined logo
    refinedLogo = data.logo;

    // Display refined logo
    displayRefinedLogo(data.logo);

  } catch (error) {
    showError(error.message);
    selectBtn.textContent = originalText;
    selectBtn.disabled = false;
  }
}

/**
 * Display the refined, sophisticated logo
 */
function displayRefinedLogo(logo) {
  // Hide any previous export success message
  hideExportSuccess();

  // Create refined logo card
  const refinedCard = document.createElement('div');
  refinedCard.className = 'concept-card refined-card';
  refinedCard.innerHTML = `
    <div class="refined-badge">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
      </svg>
      Refined Design
    </div>
    <div class="concept-preview refined-preview" id="refinedPreview">
      ${logo.svg}
    </div>
    <div class="concept-name">${escapeHtml(logo.name)}</div>
    <div class="concept-description">${escapeHtml(logo.description)}</div>
    ${logo.technique ? `<div class="concept-technique">${escapeHtml(logo.technique)}</div>` : ''}
    ${logo.colors && logo.colors.length ? `
      <div class="concept-colors">
        ${logo.colors.map(color => `<span class="color-swatch" style="background: ${color}"></span>`).join('')}
      </div>
    ` : ''}
    <div class="concept-actions">
      <button class="btn btn-primary export-btn" id="refinedExportBtn">
        Export
      </button>
    </div>
  `;

  // Prepend refined logo to the grid so it appears first (more prominent)
  conceptsGrid.insertBefore(refinedCard, conceptsGrid.firstChild);

  // Add monochrome toggle control
  const preview = refinedCard.querySelector('.refined-preview');
  const originalSVG = logo.svg;

  // Create and insert monochrome control
  const monoControl = document.createElement('div');
  monoControl.className = 'monochrome-control';
  monoControl.innerHTML = `
    <label class="mono-toggle">
      <input type="checkbox" class="mono-toggle-checkbox">
      <span class="mono-toggle-label">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="currentColor"/>
        </svg>
        Monochrome
      </span>
      <span class="mono-toggle-slider"></span>
    </label>
    <div class="mono-presets" hidden>
      <button class="mono-preset mono-preset-black active" data-color="#000000" title="Black"></button>
      <button class="mono-preset mono-preset-white" data-color="#ffffff" title="White"></button>
      <button class="mono-preset mono-preset-brand" data-color="#6366f1" title="Brand Accent"></button>
    </div>
  `;

  // Insert between preview and name
  preview.parentNode.insertBefore(monoControl, preview.nextSibling);

  // Store original SVG for export
  refinedCard.dataset.originalSvg = originalSVG;

  // Get elements
  const monoToggle = monoControl.querySelector('.mono-toggle-checkbox');
  const monoPresets = monoControl.querySelector('.mono-presets');
  const presetButtons = monoControl.querySelectorAll('.mono-preset');
  const svgElement = preview.querySelector('svg');

  // Handle toggle
  monoToggle.addEventListener('change', () => {
    monoPresets.hidden = !monoToggle.checked;
    if (monoToggle.checked) {
      svgElement.classList.add('monochrome');
      svgElement.style.color = '#000000';
      preview.classList.remove('white-mono');
    } else {
      svgElement.classList.remove('monochrome');
      svgElement.style.color = '';
      preview.classList.remove('white-mono');
    }
  });

  // Handle color presets
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      presetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      svgElement.style.color = btn.dataset.color;

      // Add visual feedback for white preset
      if (btn.dataset.color === '#ffffff') {
        preview.classList.add('white-mono');
      } else {
        preview.classList.remove('white-mono');
      }
    });
  });

  // Add event listener to Export button
  refinedCard.querySelector('#refinedExportBtn').addEventListener('click', () => exportRefinedLogo(refinedCard));

  // Reset all Select buttons so user can choose another concept
  conceptsGrid.querySelectorAll('.select-btn').forEach(btn => {
    btn.textContent = 'Select';
    btn.disabled = false;
  });

  conceptsSection.hidden = false;
}

/**
 * Convert SVG to monochrome by replacing fill and stroke values
 */
function convertSVGToMonochrome(svgString, color) {
  // Create a temporary DOM element to parse the SVG
  const temp = document.createElement('div');
  temp.innerHTML = svgString;
  const svg = temp.querySelector('svg');

  if (!svg) return svgString;

  // Remove gradients, patterns, and defs
  const defsToRemove = svg.querySelectorAll('defs, linearGradient, radialGradient, pattern');
  defsToRemove.forEach(el => el.remove());

  // Convert all elements to use the specified color
  const allElements = svg.querySelectorAll('*');
  allElements.forEach(el => {
    // Skip elements with fill="none" - keep them transparent
    if (el.getAttribute('fill') === 'none') {
      return;
    }

    // Replace fill values
    if (el.hasAttribute('fill')) {
      el.setAttribute('fill', color);
    }

    // Replace stroke values
    if (el.hasAttribute('stroke')) {
      el.setAttribute('stroke', color);
    }

    // Remove stroke-opacity and fill-opacity for solid color
    el.removeAttribute('stroke-opacity');
    el.removeAttribute('fill-opacity');
  });

  return svg.outerHTML;
}

/**
 * Export the refined logo to InsForge storage
 */
async function exportRefinedLogo(refinedCard) {
  if (!refinedCard) return;

  hideError();
  hideExportSuccess();

  const exportBtn = refinedCard.querySelector('#refinedExportBtn');
  const originalText = exportBtn.textContent;
  exportBtn.textContent = 'Exporting...';
  exportBtn.disabled = true;

  try {
    // Get the SVG to export - check if monochrome is enabled
    const monoToggle = refinedCard.querySelector('.mono-toggle-checkbox');
    const activePreset = refinedCard.querySelector('.mono-preset.active');
    let svgToExport = refinedCard.dataset.originalSvg;

    if (monoToggle && monoToggle.checked && activePreset) {
      // Convert to monochrome with the selected color
      svgToExport = convertSVGToMonochrome(svgToExport, activePreset.dataset.color);
    }

    const response = await fetch('/api/logos/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        logo: svgToExport,
        conceptName: refinedLogo.name,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to export logo');
    }

    // Show success message
    exportUrl.href = data.url;
    exportSuccess.hidden = false;

    // Scroll to success message
    exportSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } catch (error) {
    showError(error.message);
  } finally {
    exportBtn.textContent = originalText;
    exportBtn.disabled = false;
  }
}

/**
 * Set loading state for generate button
 */
function setLoading(isLoading) {
  generateBtn.disabled = isLoading;
  btnText.hidden = isLoading;
  btnLoader.hidden = !isLoading;
}

/**
 * Show error message
 */
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
  errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Hide error message
 */
function hideError() {
  errorMessage.hidden = true;
}

/**
 * Hide export success message
 */
function hideExportSuccess() {
  exportSuccess.hidden = true;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
