export type QRPayload = {
  v: 1;
  event: string;
  title?: string;
  start?: string;
  end?: string;
};

export function buildQRPayload(event: {
  eventId: string;
  title: string;
  start?: string;
  end?: string;
}): string {
  const payload: QRPayload = {
    v: 1,
    event: event.eventId,
  };

  if (event.title) payload.title = event.title;
  if (event.start) payload.start = event.start;
  if (event.end) payload.end = event.end;

  return JSON.stringify(payload);
}

export type ParseQRResult =
  | { ok: true; payload: QRPayload }
  | { ok: false; message: string };

export function parseQRPayload(raw: string): ParseQRResult {
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: 'Invalid QR code.' };
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed) ||
    parsed.v !== 1 ||
    typeof parsed.event !== 'string' ||
    !parsed.event.trim() ||
    parsed.event.length > 128 ||
    (parsed.title !== undefined && typeof parsed.title !== 'string') ||
    (parsed.start !== undefined && typeof parsed.start !== 'string') ||
    (parsed.end !== undefined && typeof parsed.end !== 'string')
  ) {
    return { ok: false, message: 'Not an attendance QR code.' };
  }

  return {
    ok: true,
    payload: {
      v: 1,
      event: parsed.event.trim(),
      ...(typeof parsed.title === 'string' ? { title: parsed.title.slice(0, 160) } : {}),
      ...(typeof parsed.start === 'string' ? { start: parsed.start } : {}),
      ...(typeof parsed.end === 'string' ? { end: parsed.end } : {}),
    },
  };
}