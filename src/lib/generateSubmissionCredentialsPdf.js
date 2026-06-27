import { jsPDF } from 'jspdf';
import { SITE_NAME } from '@/lib/seo/site';
import { ensureSpaceGroteskFonts, PDF_FONT } from '@/lib/pdfFonts';

const PAGE_WIDTH = 210;
const MARGIN_X = 16;
const MARGIN_TOP = 14;
const FOOTER_Y = 287;
const CONTENT_BOTTOM = FOOTER_Y - 6;

const BRAND = { r: 255, g: 81, b: 0 };
const INK = { r: 15, g: 23, b: 42 };
const MUTED = { r: 100, g: 116, b: 139 };
const BORDER = { r: 226, g: 232, b: 240 };
const SURFACE = { r: 248, g: 250, b: 252 };
const WARNING = { r: 180, g: 83, b: 9 };
const WARNING_SURFACE = { r: 255, g: 251, b: 235 };
const WARNING_BORDER = { r: 251, g: 191, b: 36 };

function setTextColor(pdf, color) {
  pdf.setTextColor(color.r, color.g, color.b);
}

function setFillColor(pdf, color) {
  pdf.setFillColor(color.r, color.g, color.b);
}

function setDrawColor(pdf, color) {
  pdf.setDrawColor(color.r, color.g, color.b);
}

function formatGeneratedAt() {
  return new Date().toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function resolveSubmissionLabels({ variant, isFeedbackMode, isBountyMode }) {
  const resolved =
    variant ||
    (isFeedbackMode ? 'feedback' : isBountyMode ? 'tip' : 'report');

  switch (resolved) {
    case 'feedback':
      return { title: 'Feedback Submitted', idLabel: 'Feedback ID', variant: resolved };
    case 'tip':
      return { title: 'Tip Submitted', idLabel: 'Tip ID', variant: resolved };
    case 'bounty':
      return { title: 'Bounty Submitted', idLabel: 'Bounty ID', variant: resolved };
    default:
      return { title: 'Report Submitted', idLabel: 'Report ID', variant: 'report' };
  }
}

function getWarningCopy({ hasPassword }) {
  if (hasPassword) {
    return 'Passwords cannot be recovered. Store this document securely or copy your credentials before leaving the page.';
  }
  return 'Keep your report ID safe. You will need it to track this submission.';
}

function createSubmissionPdfContext(pdf) {
  let y = MARGIN_TOP;
  const contentWidth = PAGE_WIDTH - MARGIN_X * 2;

  function setFont(style, size) {
    pdf.setFont(PDF_FONT, style);
    pdf.setFontSize(size);
  }

  function ensureSpace(height) {
    if (y + height > CONTENT_BOTTOM) {
      pdf.addPage();
      y = MARGIN_TOP;
    }
  }

  function drawBrandBar() {
    setFillColor(pdf, BRAND);
    pdf.rect(MARGIN_X, y, contentWidth, 1.4, 'F');
    y += 8;
  }

  function drawCover({ title, subtitle, generatedAt }) {
    setFont('bold', 8);
    setTextColor(pdf, BRAND);
    pdf.text(String(SITE_NAME).toUpperCase(), MARGIN_X, y);
    y += 6;

    setFont('bold', 18);
    setTextColor(pdf, INK);
    pdf.text(title, MARGIN_X, y);
    y += 8;

    setFont('normal', 9);
    setTextColor(pdf, MUTED);
    const subtitleLines = pdf.splitTextToSize(subtitle, contentWidth);
    pdf.text(subtitleLines, MARGIN_X, y);
    y += subtitleLines.length * 4.5 + 4;

    setFont('normal', 8);
    setTextColor(pdf, MUTED);
    pdf.text(`Generated ${generatedAt}`, MARGIN_X, y);
    y += 12;
  }

  function drawSectionTitle(title) {
    ensureSpace(12);
    setFillColor(pdf, BRAND);
    pdf.rect(MARGIN_X, y - 3, 3, 7, 'F');
    setFont('bold', 12);
    setTextColor(pdf, INK);
    pdf.text(title, MARGIN_X + 6, y + 2);
    y += 10;
  }

  function drawCredentialBlock({ label, value, valueSize = 14, valueColor = BRAND }) {
    const valueLines = pdf.splitTextToSize(String(value || ''), contentWidth - 12);
    const blockHeight = 10 + valueLines.length * (valueSize * 0.38);

    ensureSpace(blockHeight);

    setFont('bold', 8);
    setTextColor(pdf, MUTED);
    pdf.text(label.toUpperCase(), MARGIN_X + 6, y + 4);

    setFont('bold', valueSize);
    setTextColor(pdf, valueColor);
    pdf.text(valueLines, MARGIN_X + 6, y + 10);

    y += blockHeight;
  }

  function drawCredentialsCard(blocks) {
    const cardPadding = 6;
    let estimatedHeight = cardPadding * 2;

    blocks.forEach((block, index) => {
      const valueLines = pdf.splitTextToSize(String(block.value || ''), contentWidth - 12);
      estimatedHeight += 10 + valueLines.length * (block.valueSize * 0.38);
      if (index < blocks.length - 1) estimatedHeight += 4;
    });

    ensureSpace(estimatedHeight + 4);

    const cardTop = y;
    setFillColor(pdf, SURFACE);
    setDrawColor(pdf, BORDER);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(MARGIN_X, cardTop, contentWidth, estimatedHeight, 2, 2, 'FD');

    y = cardTop + cardPadding;

    blocks.forEach((block, index) => {
      if (index > 0) {
        setDrawColor(pdf, BORDER);
        pdf.setLineWidth(0.2);
        pdf.line(MARGIN_X + 6, y, MARGIN_X + contentWidth - 6, y);
        y += 4;
      }

      drawCredentialBlock(block);
    });

    y = cardTop + estimatedHeight + 8;
  }

  function drawWarning(text) {
    const lines = pdf.splitTextToSize(text, contentWidth - 12);
    const boxHeight = lines.length * 4.6 + 10;

    ensureSpace(boxHeight + 4);

    setFillColor(pdf, WARNING_SURFACE);
    setDrawColor(pdf, WARNING_BORDER);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(MARGIN_X, y, contentWidth, boxHeight, 2, 2, 'FD');

    setFont('normal', 9);
    setTextColor(pdf, WARNING);
    pdf.text(lines, MARGIN_X + 6, y + 7);

    y += boxHeight + 10;
  }

  function drawFooter(trackPageUrl) {
    ensureSpace(18);

    setDrawColor(pdf, BORDER);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
    y += 6;

    setFont('bold', 8);
    setTextColor(pdf, INK);
    pdf.text('Confidential — for your personal use only', MARGIN_X, y);
    y += 5;

    setFont('normal', 8);
    setTextColor(pdf, MUTED);
    const footerLines = pdf.splitTextToSize(
      `Track your submission at ${trackPageUrl}`,
      contentWidth,
    );
    pdf.text(footerLines, MARGIN_X, y);
  }

  return {
    drawBrandBar,
    drawCover,
    drawSectionTitle,
    drawCredentialsCard,
    drawWarning,
    drawFooter,
  };
}

export async function generateSubmissionCredentialsPdf({
  reportId,
  password,
  trackPageUrl,
  isFeedbackMode = false,
  isBountyMode = false,
  variant,
}) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  await ensureSpaceGroteskFonts(pdf);

  const ctx = createSubmissionPdfContext(pdf);
  const labels = resolveSubmissionLabels({ variant, isFeedbackMode, isBountyMode });
  const hasPassword = Boolean(password);

  ctx.drawBrandBar();
  ctx.drawCover({
    title: labels.title,
    subtitle:
      'Save these access details in a secure location. They cannot be recovered later.',
    generatedAt: formatGeneratedAt(),
  });

  ctx.drawSectionTitle('Access credentials');

  const blocks = [
    {
      label: 'Track page',
      value: trackPageUrl,
      valueSize: 11,
      valueColor: BRAND,
    },
    {
      label: labels.idLabel,
      value: reportId,
      valueSize: 14,
      valueColor: BRAND,
    },
  ];

  if (hasPassword) {
    blocks.push({
      label: 'Password',
      value: password,
      valueSize: 12,
      valueColor: INK,
    });
  }

  ctx.drawCredentialsCard(blocks);
  ctx.drawWarning(getWarningCopy({ hasPassword }));
  ctx.drawFooter(trackPageUrl);

  return pdf;
}

export async function downloadSubmissionCredentialsPdf(options) {
  const pdf = await generateSubmissionCredentialsPdf(options);
  pdf.save(`whistleblower-${options.reportId}.pdf`);
}
