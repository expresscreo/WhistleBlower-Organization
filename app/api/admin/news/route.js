import { formatSupabaseError } from '@/lib/supabaseErrors';
import { jsonError, readJson } from '../../track/_utils';
import { persistNewsRecord, pickNewsPayload, requireNewsAdmin } from './_utils';

export const runtime = 'nodejs';

async function handleSave(request, { id, body } = {}) {
  const auth = await requireNewsAdmin(request);
  if (auth.error) return auth.error;

  const parsedBody = body ?? (await readJson(request));
  const payload = pickNewsPayload(parsedBody);

  if (!payload?.title?.trim()) {
    return jsonError('Title is required.');
  }
  if (!payload?.category?.trim()) {
    return jsonError('Category is required.');
  }

  try {
    const { result, warnings } = await persistNewsRecord(auth.service, payload, id);
    if (result.error) {
      console.error('News save failed:', result.error);
      return jsonError(formatSupabaseError(result.error), 500);
    }

    return Response.json({
      id: result.data?.id || id || null,
      warnings,
    });
  } catch (error) {
    console.error('News save failed:', error);
    return jsonError(formatSupabaseError(error), 500);
  }
}

export async function POST(request) {
  return handleSave(request);
}

export async function PATCH(request) {
  const body = await readJson(request);
  const id = typeof body?.id === 'string' ? body.id.trim() : '';
  if (!id) return jsonError('News post id is required for updates.');
  return handleSave(request, { id, body });
}
