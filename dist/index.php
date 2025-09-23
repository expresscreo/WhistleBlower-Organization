<?php
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
    echo '<!DOCTYPE html><html><head><title>404 - Not Found</title></head><body><h1>404 This Page Does Not Exist</h1><p>Sorry, the page you are looking for could not be found. It\'s just an accident that was not intentional.</p></body></html>';
}
?>
