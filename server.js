import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the public directory
app.use(express.static('public'));

// Serve built assets from the dist directory
app.use(express.static('dist'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Support both body.path and query.path for flexibility
    const uploadPath = req.query.path || req.body.path || 'public/WBMedia/general';
    
    // Ensure the directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Preserve original sanitized name as much as possible
    const base = path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.bin';
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// File upload endpoint
app.post('/api/upload', (req, res, next) => {
  // Bridge query path to body for multer's storage callback visibility if needed
  if (req.query?.path && !req.body?.path) {
    req.body = { ...(req.body || {}), path: req.query.path };
  }
  next();
}, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the public URL path
    const publicPath = '/' + path.relative('public', req.file.path).split(path.sep).join('/');
    res.json({ 
      success: true, 
      filePath: publicPath,
      filename: req.file.filename 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the built React app for all non-API routes (SPA fallback)
// This handles client-side routing when users refresh the page
app.use((req, res, next) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Serve index.html for all other routes (SPA fallback)
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback if dist folder doesn't exist (development mode)
    res.status(404).send(`
      <html>
        <head><title>404 - Development Mode</title></head>
        <body>
          <h1>404 This Page Does Not Exist</h1>
          <p>Sorry, the page you are looking for could not be found. It's just an accident that was not intentional.</p>
          <p><strong>Note:</strong> This is development mode. Make sure to build the project with <code>npm run build</code> for production.</p>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`File upload server running on port ${PORT}`);
  console.log(`Access files at: http://localhost:${PORT}/WBMedia/`);
  console.log(`SPA fallback enabled - serving index.html for all non-API routes`);
});

export default app;
