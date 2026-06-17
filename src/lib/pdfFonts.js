const PDF_FONT = 'SpaceGrotesk';
const FONT_FILE = 'SpaceGrotesk.ttf';

let fontBase64 = null;
let fontsLoadPromise = null;

async function fetchFontAsBase64(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Could not load report fonts.');
  }

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // TrueType / OpenType fonts start with 0x00010000 or 'OTTO' / 'true'
  const isTtf =
    (bytes.length > 4 && bytes[0] === 0x00 && bytes[1] === 0x01) ||
    (bytes[0] === 0x4f && bytes[1] === 0x54 && bytes[2] === 0x54 && bytes[3] === 0x4f);

  if (!isTtf) {
    throw new Error('Could not load report fonts.');
  }

  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function loadFontData() {
  if (!fontsLoadPromise) {
    fontsLoadPromise = fetchFontAsBase64('/fonts/SpaceGrotesk-Regular.ttf').then(
      (base64) => {
        fontBase64 = base64;
      },
    );
  }

  await fontsLoadPromise;
}

const registeredDocs = new WeakSet();

export async function ensureSpaceGroteskFonts(pdf) {
  await loadFontData();

  if (!registeredDocs.has(pdf)) {
    pdf.addFileToVFS(FONT_FILE, fontBase64);
    pdf.addFont(FONT_FILE, PDF_FONT, 'normal');
    pdf.addFont(FONT_FILE, PDF_FONT, 'bold');
    registeredDocs.add(pdf);
  }

  pdf.setFont(PDF_FONT, 'normal');
}

export { PDF_FONT };
