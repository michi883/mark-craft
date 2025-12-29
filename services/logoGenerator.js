/**
 * AI Provider Configuration
 * Supports: Gemini (default), Groq, OpenRouter, Anthropic
 */

const AI_PROVIDER = process.env.AI_PROVIDER || 'gemini';

// Gemini Configuration (Google AI - Free tier available)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Make the model configurable via env var, default to gemini-3-flash-preview
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Groq Configuration (FREE - recommended for hackathons)
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// OpenRouter Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Anthropic Configuration (original)
let anthropic = null;
if (process.env.ANTHROPIC_API_KEY) {
  const Anthropic = require('@anthropic-ai/sdk');
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

/**
 * Generate logo concepts using Google Gemini
 */
async function generateWithGemini(description) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not set. Get free key at https://aistudio.google.com/apikey');
  }

  const prompt = `You are a branding expert. Given this product description, extract brand keywords, tone, and create 3 unique logo concepts.

Product description: "${description}"

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "tone": "adjective describing the brand personality",
  "logos": [
    {
      "id": "1",
      "name": "Concept Name",
      "description": "Brief explanation of the concept",
      "svg": "<svg>...</svg>"
    },
    {
      "id": "2",
      "name": "Concept Name",
      "description": "Brief explanation of the concept",
      "svg": "<svg>...</svg>"
    },
    {
      "id": "3",
      "name": "Concept Name",
      "description": "Brief explanation of the concept",
      "svg": "<svg>...</svg>"
    }
  ]
}

Design guidelines for SVG logos:
- Use simple, clean geometric shapes
- Maximum 3 colors from a harmonious palette
- ViewBox should be "0 0 200 200"
- Include text only if it's a wordmark style (keep it short)
- Ensure contrast and scalability
- Use modern, minimal aesthetics`;

  const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 3000,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  let content = data.candidates[0].content.parts[0].text;

  // Clean up JSON response
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  return JSON.parse(content);
}

/**
 * Generate logo concepts using Groq (FREE, fast)
 */
async function generateWithGroq(description) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not set. Get free key at https://groq.com');
  }

  const prompt = `You are a branding expert. Given this product description, extract brand keywords, tone, and create 3 unique logo concepts.

Product description: "${description}"

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "tone": "adjective describing the brand personality",
  "logos": [
    {
      "id": "1",
      "name": "Concept Name",
      "description": "Brief explanation of the concept",
      "svg": "<svg>...</svg>"
    },
    {
      "id": "2",
      "name": "Concept Name",
      "description": "Brief explanation of the concept",
      "svg": "<svg>...</svg>"
    },
    {
      "id": "3",
      "name": "Concept Name",
      "description": "Brief explanation of the concept",
      "svg": "<svg>...</svg>"
    }
  ]
}

Design guidelines for SVG logos:
- Use simple, clean geometric shapes
- Maximum 3 colors from a harmonious palette
- ViewBox should be "0 0 200 200"
- Include text only if it's a wordmark style (keep it short)
- Ensure contrast and scalability
- Use modern, minimal aesthetics`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  let content = data.choices[0].message.content;

  // Clean up JSON response
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  return JSON.parse(content);
}

/**
 * Generate logo concepts using OpenRouter
 */
async function generateWithOpenRouter(description) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not set. Get free key at https://openrouter.ai');
  }

  const prompt = `You are a branding expert. Given this product description, extract brand keywords, tone, and create 3 unique logo concepts.

Product description: "${description}"

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "tone": "adjective describing the brand personality",
  "logos": [
    {
      "id": "1",
      "name": "Concept Name",
      "description": "Brief explanation of the concept",
      "svg": "<svg>...</svg>"
    },
    {
      "id": "2",
      "name": "Concept Name",
      "description": "Brief explanation of the concept",
      "svg": "<svg>...</svg>"
    },
    {
      "id": "3",
      "name": "Concept Name",
      "description": "Brief explanation of the concept",
      "svg": "<svg>...</svg>"
    }
  ]
}

Design guidelines for SVG logos:
- Use simple, clean geometric shapes
- Maximum 3 colors from a harmonious palette
- ViewBox should be "0 0 200 200"
- Include text only if it's a wordmark style (keep it short)
- Ensure contrast and scalability
- Use modern, minimal aesthetics`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://mark-craft.zeabur.app',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  let content = data.choices[0].message.content;

  // Clean up JSON response
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  return JSON.parse(content);
}

/**
 * Generate logo concepts using Anthropic Claude (original)
 */
async function generateWithAnthropic(description) {
  if (!anthropic) {
    throw new Error('ANTHROPIC_API_KEY not set. Get key at https://console.anthropic.com');
  }

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are a branding expert. Given this product description, extract brand keywords, tone, and create 3 unique logo concepts.

Product description: "${description}"

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "tone": "adjective describing the brand personality",
  "logos": [
    {
      "id": "1",
      "name": "Concept Name",
      "description": "Brief explanation of the concept",
      "svg": "<svg>...</svg>"
    },
    {
      "id": "2",
      "name": "Concept Name",
      "description": "Brief explanation of the concept",
      "svg": "<svg>...</svg>"
    },
    {
      "id": "3",
      "name": "Concept Name",
      "description": "Brief explanation of the concept",
      "svg": "<svg>...</svg>"
    }
  ]
}

Design guidelines for SVG logos:
- Use simple, clean geometric shapes
- Maximum 3 colors from a harmonious palette
- ViewBox should be "0 0 200 200"
- Include text only if it's a wordmark style (keep it short)
- Ensure contrast and scalability
- Use modern, minimal aesthetics`
      }
    ]
  });

  let content = message.content[0].text;
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  return JSON.parse(content);
}

/**
 * Main entry point - routes to appropriate AI provider
 */
async function generateLogoConcepts(description) {
  const provider = AI_PROVIDER.toLowerCase();

  switch (provider) {
    case 'gemini':
    case 'google':
      return await generateWithGemini(description);
    case 'groq':
      return await generateWithGroq(description);
    case 'openrouter':
      return await generateWithOpenRouter(description);
    case 'anthropic':
    case 'claude':
      return await generateWithAnthropic(description);
    default:
      // Try providers in order (gemini first)
      try {
        if (GEMINI_API_KEY) return await generateWithGemini(description);
      } catch (e) {
        console.log('Gemini failed, trying next provider...');
      }
      try {
        if (GROQ_API_KEY) return await generateWithGroq(description);
      } catch (e) {
        console.log('Groq failed, trying next provider...');
      }
      try {
        if (OPENROUTER_API_KEY) return await generateWithOpenRouter(description);
      } catch (e) {
        console.log('OpenRouter failed, trying next provider...');
      }
      if (anthropic) return await generateWithAnthropic(description);

      throw new Error('No AI provider configured. Set GEMINI_API_KEY (recommended - free), GROQ_API_KEY, OPENROUTER_API_KEY, or ANTHROPIC_API_KEY');
  }
}

module.exports = { generateLogoConcepts };
