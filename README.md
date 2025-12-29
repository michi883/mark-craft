# Mark Craft

AI-powered logo generator that transforms your product description into professional brand logos.

## Features

- **Smart Brand Analysis**: Extracts keywords and tone from your product description
- **Multiple Logo Concepts**: Generates 3 unique initial logo concepts
- **Refined Design**: Select any concept to generate a sophisticated, professional logo
- **Monochrome Export**: Toggle between color and monochrome versions with preset color options (Black, White, Brand Accent)
- **Cloud Storage**: Export logos directly to InsForge S3-compatible storage
- **Responsive Design**: Beautiful dark-themed UI that works on all devices

## Tech Stack

### Backend
- **Node.js** + **Express** - Fast, minimalist web framework
- **Google Gemini 3 Flash Preview** - Free AI API for logo generation
- **InsForge Storage** - S3-compatible file storage

### Frontend
- **Vanilla JavaScript** - No frameworks, pure JS
- **CSS Grid & Flexbox** - Modern, responsive layouts
- **SVG** - Scalable vector graphics output

## Project Structure

```
mark-craft/
├── public/
│   ├── index.html      # Main HTML page
│   ├── style.css       # All styling
│   └── app.js          # Frontend logic
├── routes/
│   └── logos.js        # API endpoints
├── services/
│   ├── logoGenerator.js  # AI provider integration
│   └── storage.js        # InsForge storage service
├── server.js           # Express server entry point
├── package.json
└── .env                # Environment variables
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Google AI API key ([Get free key](https://aistudio.google.com/apikey))
- InsForge storage credentials (optional, for export feature)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd mark-craft
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the project root:
```env
# Google Gemini API (required)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Model selection (default: gemini-3-flash-preview)
GEMINI_MODEL=gemini-3-flash-preview

# Optional: InsForge Storage (for export feature)
INSFORGE_STORAGE_KEY=your_insforge_key
INSFORGE_STORAGE_URL=https://your-region.insforge.app

# Optional: Alternative AI providers
GROQ_API_KEY=your_groq_key
OPENROUTER_API_KEY=your_openrouter_key
ANTHROPIC_API_KEY=your_anthropic_key
AI_PROVIDER=gemini
```

4. Start the development server:
```bash
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google AI API key for logo generation |
| `GEMINI_MODEL` | No | Gemini model to use (default: `gemini-3-flash-preview`) |
| `INSFORGE_STORAGE_KEY` | No | InsForge storage key for exporting logos |
| `INSFORGE_STORAGE_URL` | No | Your InsForge storage URL |
| `AI_PROVIDER` | No | AI provider to use (`gemini`, `groq`, `openrouter`, `anthropic`) |

### Getting API Keys

**Google Gemini (Free):**
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a new API key
3. Add it to your `.env` file

**InsForge Storage (Optional):**
1. Sign up at [InsForge](https://insforge.dev)
2. Create a storage bucket named `logos`
3. Add credentials to your `.env` file

## API Endpoints

### POST /api/logos/generate
Generate logo concepts from a product description.

**Request:**
```json
{
  "description": "A mobile app for tracking daily habits"
}
```

**Response:**
```json
{
  "success": true,
  "keywords": ["consistency", "growth", "routine"],
  "tone": "motivating",
  "logos": [
    {
      "id": "1",
      "name": "HabitLoop",
      "description": "A circular progress ring with a success checkmark",
      "svg": "<svg>...</svg>"
    }
  ]
}
```

### POST /api/logos/refine
Refine a selected concept into a professional logo.

**Request:**
```json
{
  "concept": {
    "id": "1",
    "name": "HabitLoop",
    "description": "A circular progress ring"
  },
  "description": "A mobile app for tracking daily habits"
}
```

**Response:**
```json
{
  "success": true,
  "logo": {
    "id": "refined",
    "name": "HabitLoop Professional",
    "description": "Refined professional logo for HabitLoop",
    "svg": "<svg>...</svg>",
    "technique": "Professional minimalist design",
    "refined": true
  }
}
```

### POST /api/logos/export
Export a logo to InsForge storage.

**Request:**
```json
{
  "logo": "<svg>...</svg>",
  "conceptName": "HabitLoop Professional"
}
```

**Response:**
```json
{
  "success": true,
  "fileName": "habitloop_1234567890_abc123.svg",
  "url": "https://your-region.insforge.app/api/storage/buckets/logos/objects/..."
}
```

## How It Works

1. **User Input**: Enter a one-sentence product description
2. **Brand Analysis**: AI extracts keywords and brand tone
3. **Concept Generation**: AI creates 3 unique SVG logo concepts
4. **Refinement**: User selects a concept to refine into a polished logo
5. **Monochrome Mode**: Toggle monochrome and choose from preset colors
6. **Export**: Save the final logo to cloud storage

## Deployment

### Zeabur Deployment

1. Push your code to GitHub
2. Create a new project on [Zeabur](https://zeabur.com)
3. Connect your GitHub repository
4. Add environment variables in Zeabur dashboard:
   - `GEMINI_API_KEY`
   - `INSFORGE_STORAGE_KEY` (optional)
   - `INSFORGE_STORAGE_URL` (optional)
5. Deploy!

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Usage Flow

1. **Enter Description**: Type your product description (max 500 characters)
2. **Generate Logos**: Click "Generate Logos" to create 3 concepts
3. **View Brand Analysis**: See extracted keywords and tone
4. **Select Concept**: Click "Select" on any concept to refine it
5. **Toggle Monochrome**: Enable monochrome mode and choose a color preset
6. **Export Logo**: Click "Export" to save to InsForge storage

## Monochrome Feature

The refined logo includes a monochrome toggle that:
- Instantly switches between color and single-color versions
- Offers 3 color presets: Black, White, and Brand Accent (#6366f1)
- Uses CSS `currentColor` for instant preview
- Exports the actual transformed SVG with fill/stroke values replaced
- Automatically removes gradients and patterns in monochrome mode

## Development

### Running Locally

```bash
npm install
npm start
```

### Code Style

- Vanilla JavaScript (no frameworks)
- Semantic HTML5
- CSS custom properties for theming
- Responsive design with CSS Grid and Flexbox

### Adding New AI Providers

Edit `services/logoGenerator.js` and add a new function following the existing pattern:

```javascript
async function generateWithNewProvider(description) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { /* ... */ },
    body: JSON.stringify({ /* ... */ })
  });
  // Return format: { keywords, tone, logos }
  return JSON.parse(content);
}
```

Then add the provider to the switch statement in `generateLogoConcepts()`.

## License

MIT

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ for hackathons and rapid prototyping.
