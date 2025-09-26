<?php
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
?>