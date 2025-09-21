# Local File Storage Setup

This guide explains how to set up local file storage for the WhistleBlower.ng application instead of using Supabase storage.

## Overview

The application now supports storing media files locally in the `/WBMedia/` directory structure instead of using Supabase storage. This approach:

- Reduces costs (no Supabase storage fees)
- Gives you full control over file management
- Serves files directly from your hosting server
- Uses clean URLs like `/WBMedia/news/image-name.jpg`

## Setup Instructions

### 1. Install Server Dependencies

```bash
# Install the server dependencies
npm install express multer cors nodemon

# Or copy the server-package.json and install:
cp server-package.json package.json
npm install
```

### 2. Start the File Upload Server

```bash
# Start the file upload server (in a separate terminal)
node server.js

# Or for development with auto-restart:
npx nodemon server.js
```

The server will run on port 3001 by default.

### 3. Start the Frontend Development Server

```bash
# In another terminal, start the frontend
npm run dev
```

The Vite dev server is configured to proxy `/api` requests to the file upload server.

## File Structure

Files are organized in the following structure:

```
public/
├── WBMedia/
│   ├── bounties/
│   │   └── delito/                    # Generic folder to hide bounty IDs
│   │       └── [timestamp]-[filename].jpg
│   ├── news/
│   │   ├── [news-id]/
│   │   │   └── [timestamp]-[filename].jpg
│   │   └── inline/
│   │       └── [timestamp]-[filename].jpg
│   └── reports/
│       └── [report-id]/
│           └── [timestamp]-[filename].jpg
```

## URL Structure

Files are accessible via clean URLs:

- `/WBMedia/news/12345/1703123456789-image.jpg`
- `/WBMedia/bounties/delito/1703123456789-photo.jpg`
- `/WBMedia/news/inline/1703123456789-screenshot.png`

## Production Deployment

### Option 1: Single Server Setup

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Start the server (it serves static files from the `public` directory):
   ```bash
   NODE_ENV=production node server.js
   ```

### Option 2: Separate Frontend/Backend

1. Deploy the built frontend to your web server
2. Deploy the Node.js server separately
3. Update the proxy configuration in `vite.config.js` to point to your production server URL

## Migration from Supabase

The application automatically converts Supabase storage paths to local paths. Existing images will continue to work, but new uploads will use the local storage system.

## Configuration

### Server Configuration

The server can be configured via environment variables:

- `PORT`: Server port (default: 3001)
- File size limit: 10MB (configurable in `server.js`)
- Allowed file types: Images only (configurable in `server.js`)

### Frontend Configuration

The file upload behavior is controlled by:

- `src/lib/fileUtils.js`: File upload utilities
- `vite.config.js`: API proxy configuration

## Troubleshooting

### Files Not Uploading

1. Ensure the file upload server is running
2. Check that the `/WBMedia/` directory exists and is writable
3. Verify the API proxy is working in Vite config

### Images Not Displaying

1. Check that files exist in the `/WBMedia/` directory
2. Verify the file URLs are correctly generated
3. Ensure your web server can serve static files from the public directory

### CORS Issues

The server includes CORS headers, but if you encounter issues:

1. Check that the frontend URL is allowed
2. Verify the proxy configuration in `vite.config.js`

## Security Considerations

1. **File Validation**: Only image files are allowed
2. **File Size Limits**: 10MB maximum per file
3. **Directory Structure**: Files are organized by category with generic folder names
4. **Privacy Protection**: Bounty IDs are hidden using generic "delito" folder name
5. **Access Control**: Consider adding authentication for uploads in production

## Benefits

- ✅ No storage costs
- ✅ Full control over files
- ✅ Clean, SEO-friendly URLs
- ✅ Fast local serving
- ✅ Easy backup and migration
- ✅ No vendor lock-in

## Next Steps

1. Test file uploads in development
2. Deploy to production
3. Migrate existing files if needed
4. Set up automated backups of the `/WBMedia/` directory
