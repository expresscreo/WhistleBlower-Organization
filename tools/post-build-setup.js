#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const distPath = path.join(projectRoot, 'dist');
const publicPath = path.join(projectRoot, 'public');

console.log('🔧 Running post-build setup...');

// Create .htaccess file
const htaccessContent = `# Enable mod_rewrite
RewriteEngine On

# Handle Angular and React Router (SPA fallback)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set Referrer-Policy strict-origin-when-cross-origin
Header always set X-Powered-By "WhistleBlower.ng"

# Cache static assets
<FilesMatch "\\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
    Header set Cache-Control "public, immutable"
</FilesMatch>

# Compress files
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>`;

// Create index.php fallback
const indexPhpContent = `<?php
// SPA Fallback for React Router
// This file serves index.html for all routes that don't exist as files

$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Don't interfere with API routes
if (strpos($path, '/api/') === 0) {
    http_response_code(404);
    echo json_encode(['error' => 'API endpoint not found']);
    exit;
}

// Check if the requested file exists
$file_path = __DIR__ . $path;
if (file_exists($file_path) && is_file($file_path)) {
    // Let the web server handle the file normally
    return false;
}

// Serve index.html for all other routes (SPA fallback)
$index_path = __DIR__ . '/index.html';
if (file_exists($index_path)) {
    readfile($index_path);
} else {
    http_response_code(404);
    echo '<!DOCTYPE html><html><head><title>404 - Not Found</title></head><body><h1>404 This Page Does Not Exist</h1><p>Sorry, the page you are looking for could not be found. It\\'s just an accident that was not intentional.</p></body></html>';
}
?>`;

// Create upload.php for handling file uploads on shared hosting (PHP)
const uploadPhpContent = `<?php
// Simple PHP upload handler for WhistleBlower.ng
// Saves files into /WBMedia/<category>/<subfolder>/

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Ensure the request contains a file
if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Upload error: ' . $file['error']]);
    exit;
}

// Parse destination from query string: path=public/WBMedia/<category>/<subfolder>
$path = isset($_GET['path']) ? $_GET['path'] : 'public/WBMedia/general';

// Prevent directory traversal
$path = str_replace('..', '', $path);

$root = __DIR__;
$destDir = $root . '/' . $path;

// Ensure directory exists
if (!is_dir($destDir)) {
    mkdir($destDir, 0775, true);
}

// Sanitize filename
$originalName = $file['name'];
$base = pathinfo($originalName, PATHINFO_FILENAME);
$ext = pathinfo($originalName, PATHINFO_EXTENSION);
$base = preg_replace('/[^a-zA-Z0-9._-]/', '_', $base);
$unique = time() . '-' . rand(100000000, 999999999);
$filename = $base . '-' . $unique . ($ext ? '.' . $ext : '');

$destPath = $destDir . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to move uploaded file']);
    exit;
}

// Build public path: remove leading 'public/' and normalize slashes
$publicPath = '/' . str_replace('public/', '', $path) . '/' . $filename;
$publicPath = preg_replace('#/+#','/',$publicPath);

header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'filePath' => $publicPath,
    'filename' => $filename
]);
?>`;

try {
    // Write .htaccess file
    const htaccessPath = path.join(distPath, '.htaccess');
    fs.writeFileSync(htaccessPath, htaccessContent);
    console.log('✅ Created .htaccess file');

    // Write index.php fallback
    const indexPhpPath = path.join(distPath, 'index.php');
    fs.writeFileSync(indexPhpPath, indexPhpContent);
    console.log('✅ Created index.php fallback');

    // Write upload.php
    const uploadPhpPath = path.join(distPath, 'upload.php');
    fs.writeFileSync(uploadPhpPath, uploadPhpContent);
    console.log('✅ Created upload.php endpoint');

    console.log('🎉 Post-build setup complete!');
    console.log('📁 Files created in dist/:');
    console.log('  - .htaccess (for Apache mod_rewrite)');
    console.log('  - index.php (PHP fallback for SPA routing)');
    console.log('  - upload.php (PHP upload endpoint for WBMedia)');

} catch (error) {
    console.error('❌ Error during post-build setup:', error.message);
    process.exit(1);
}
