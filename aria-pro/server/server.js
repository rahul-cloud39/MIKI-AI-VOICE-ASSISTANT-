import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import RAGService from './services/ragService.js';
import WebSearchService from './services/webSearchService.js';
import ImageVisionService from './services/imageVisionService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });
dotenv.config({ path: join(__dirname, '..', '.env'), override: false });

const app = express();
const PORT = process.env.PORT || 5000;
const buildPath = join(__dirname, '..', 'build');
const hasBuild = existsSync(join(buildPath, 'index.html'));

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

if (hasBuild) {
  app.use(express.static(buildPath));
}

// Initialize services
const ragService = new RAGService();
const webSearchService = new WebSearchService();
const imageVisionService = new ImageVisionService();

// RAG Routes
app.post('/api/rag/upload', async (req, res) => {
  try {
    const { file } = req.body;
    const result = await ragService.uploadPDF(file);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rag/query', async (req, res) => {
  try {
    const { query, useRAG } = req.body;
    const result = await ragService.queryDocuments(query, useRAG);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Web Search Routes
app.post('/api/search/web', async (req, res) => {
  try {
    const { query, useWebSearch } = req.body;
    const result = await webSearchService.searchWeb(query, useWebSearch);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Image Vision Routes
app.post('/api/vision/analyze', async (req, res) => {
  try {
    const { imageBase64, query, mimeType } = req.body;
    const result = await imageVisionService.analyzeImage(imageBase64, query, mimeType);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

if (hasBuild) {
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) {
      return next();
    }

    return res.sendFile(join(buildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      status: 'ok',
      service: 'MIKI API server',
      frontend: 'http://localhost:3000',
      note: 'Build folder not found, so the frontend is not being served from this port yet.'
    });
  });
}

app.listen(PORT, () => {
  console.log(`MIKI Server running on http://localhost:${PORT}`);
});
