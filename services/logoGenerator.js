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

  const prompt = `You are a branding expert. Generate logo concepts for this product: "${description}"

Return ONLY valid JSON in this compact format (no markdown, no newlines in values):

{"keywords":["k1","k2","k3"],"tone":"word","logos":[{"id":"1","name":"Name","description":"Brief","svg":"<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 200 200\\"><circle cx=\\"100\\" cy=\\"100\\" r=\\"50\\" fill=\\"#6366f1\\\"/></svg>"},{"id":"2","name":"Name","description":"Brief","svg":"..."},{"id":"3","name":"Name","description":"Brief","svg":"..."}]}

CRITICAL RULES:
- Entire response must be ONE LINE of valid JSON
- SVG must be minified (no line breaks, no extra spaces)
- Escape all quotes in SVG: use \\" not "
- Keep SVG simple: basic shapes only
- Use only 2-3 hex colors like #6366f1, #22c55e, #ef4444
- No comments, no markdown blocks, no text outside JSON

Example SVG: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="50" fill="#6366f1"/><rect x="70" y="70" width="60" height="60" fill="#22c55e"/></svg>`;

  console.log(`Calling Gemini API: ${GEMINI_MODEL}`);

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Gemini API error response:', error);
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log('Gemini API response:', JSON.stringify(data).substring(0, 200));

  // Handle different response structures
  let content;
  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    content = data.candidates[0].content.parts[0].text;
  } else {
    throw new Error(`Unexpected Gemini API response structure: ${JSON.stringify(data).substring(0, 200)}`);
  }

  // Clean up JSON response - extract JSON block if wrapped in markdown
  let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    content = jsonMatch[1].trim();
  } else {
    // Try to find JSON object
    jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }
  }

  // Clean up any trailing commas in JSON (common issue)
  content = content.replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.error('Failed to parse JSON response, attempting to fix...');
    console.error('Content preview:', content.substring(0, 500));

    // Try to fix common JSON issues - unescaped newlines in strings
    content = content.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');

    try {
      return JSON.parse(content);
    } catch (retryError) {
      throw new Error(`Failed to parse AI response as JSON. The AI may have generated invalid content. Error: ${retryError.message}`);
    }
  }
}

/**
 * Refine a logo concept into a sophisticated, professional logo
 * Simplified approach: Get ONLY the SVG, then wrap it ourselves
 */
async function refineLogoConcept(concept, productDescription) {
  // Simpler prompt - just ask for SVG
  const prompt = `Create a minimalist SVG logo. 200x200 viewBox. Use geometric shapes and 2-3 colors.

Logo name: ${concept.name}
Context: ${productDescription}

Return ONLY the SVG code. No markdown, no explanation.`;

  console.log(`Refining logo: ${concept.name}`);

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Gemini API error response:', error);
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  let content = data.candidates[0].content.parts[0].text;

  console.log('Raw response (first 500 chars):', content.substring(0, 500));
  console.log('Full response length:', content.length);

  // Extract SVG - remove markdown if present
  content = content.replace(/```xml\s*/g, '').replace(/```\s*/g, '').trim();
  content = content.replace(/```svg\s*/g, '').replace(/```\s*/g, '').trim();

  // Extract just the SVG tag - use greedy match to get complete SVG
  let svgMatch = content.match(/<svg[^>]*>[\s\S]*?<\/svg>/i);
  if (!svgMatch) {
    // Try alternative pattern - maybe SVG is self-closing or has different formatting
    svgMatch = content.match(/<svg[\s\S]+?>/i);
  }
  if (!svgMatch) {
    console.error('Could not find SVG in response. Full response:', content);
    throw new Error('No valid SVG found in response');
  }

  let svg = svgMatch[0];

  // Clean up SVG - minify it
  svg = svg
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  console.log('Extracted SVG (first 200 chars):', svg.substring(0, 200));
  console.log('SVG length:', svg.length);

  // Verify SVG is valid
  if (!svg.startsWith('<svg') || !svg.endsWith('</svg>')) {
    throw new Error('Invalid SVG structure');
  }

  // Return our own response object
  return {
    id: 'refined',
    name: `${concept.name} Professional`,
    description: `Refined professional logo for ${concept.name}`,
    svg: svg,
    colors: [],
    technique: 'Professional minimalist design',
    refined: true,
  };
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

module.exports = { generateLogoConcepts, refineLogoConcept };
