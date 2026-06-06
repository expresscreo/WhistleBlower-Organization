import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadPath = searchParams.get('path') || 'public/WBMedia/general';
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return Response.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const absoluteDir = path.isAbsolute(uploadPath)
      ? uploadPath
      : path.join(process.cwd(), uploadPath);

    await mkdir(absoluteDir, { recursive: true });

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${Date.now()}-${sanitizedName}`;
    const absoluteFilePath = path.join(absoluteDir, fileName);

    await writeFile(absoluteFilePath, buffer);

    const publicPath = `/${path.relative(path.join(process.cwd(), 'public'), absoluteFilePath).split(path.sep).join('/')}`;

    return Response.json({
      success: true,
      filePath: publicPath,
      filename: fileName,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}
