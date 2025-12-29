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

let currentLogos = [];
let selectedConceptId = null;

// Event Listeners
form.addEventListener('submit', handleGenerate);

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

  // Reset UI
  hideError();
  hideExportSuccess();
  brandSection.hidden = true;
  conceptsSection.hidden = true;
  conceptsGrid.innerHTML = '';
  currentLogos = [];
  selectedConceptId = null;

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
        <button class="btn btn-secondary select-btn" data-id="${logo.id}">
          Select
        </button>
        <button class="btn btn-primary export-btn" data-id="${logo.id}">
          Export
        </button>
      </div>
    </div>
  `).join('');

  // Add event listeners to buttons
  conceptsGrid.querySelectorAll('.select-btn').forEach(btn => {
    btn.addEventListener('click', () => selectConcept(btn.dataset.id));
  });

  conceptsGrid.querySelectorAll('.export-btn').forEach(btn => {
    btn.addEventListener('click', () => exportLogo(btn.dataset.id));
  });

  conceptsSection.hidden = false;
}

/**
 * Select a logo concept
 */
function selectConcept(id) {
  selectedConceptId = id;

  conceptsGrid.querySelectorAll('.concept-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.id === id);
  });

  conceptsGrid.querySelectorAll('.select-btn').forEach(btn => {
    btn.textContent = btn.dataset.id === id ? 'Selected' : 'Select';
  });
}

/**
 * Export a logo to InsForge storage
 */
async function exportLogo(id) {
  const logo = currentLogos.find(l => l.id === id);
  if (!logo) return;

  hideError();
  hideExportSuccess();

  // Find the export button and set loading state
  const exportBtn = conceptsGrid.querySelector(`.export-btn[data-id="${id}"]`);
  const originalText = exportBtn.textContent;
  exportBtn.textContent = 'Exporting...';
  exportBtn.disabled = true;

  try {
    const response = await fetch('/api/logos/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        logo: logo.svg,
        conceptName: logo.name,
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
