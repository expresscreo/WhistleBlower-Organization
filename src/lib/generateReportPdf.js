import { jsPDF } from 'jspdf';
import { SITE_NAME } from '@/lib/seo/site';
import { ensureSpaceGroteskFonts, PDF_FONT } from '@/lib/pdfFonts';
import {
  getAttachmentDisplayName,
  getAttachmentPreviewType,
  getAttachmentTypeLabel,
} from '@/lib/attachmentUtils';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_X = 16;
const MARGIN_TOP = 14;
const FOOTER_Y = 287;
const CONTENT_BOTTOM = FOOTER_Y - 6;

const BRAND = { r: 255, g: 81, b: 0 };
const INK = { r: 15, g: 23, b: 42 };
const MUTED = { r: 100, g: 116, b: 139 };
const BORDER = { r: 226, g: 232, b: 240 };
const SURFACE = { r: 248, g: 250, b: 252 };
const REPORTER_BUBBLE = { r: 241, g: 245, b: 249 };
const WHITE = { r: 255, g: 255, b: 255 };

const STATUS_LABELS = {
  pending: 'Pending',
  under_review: 'Under Review',
  assigned: 'Assigned',
  resolved: 'Resolved',
  rejected: 'Rejected',
  closed: 'Closed',
};

const URGENCY_LABELS = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

function setTextColor(pdf, color) {
  pdf.setTextColor(color.r, color.g, color.b);
}

function setFillColor(pdf, color) {
  pdf.setFillColor(color.r, color.g, color.b);
}

function setDrawColor(pdf, color) {
  pdf.setDrawColor(color.r, color.g, color.b);
}

function formatLabel(value) {
  if (!value) return 'N/A';
  const normalized = String(value).trim();
  return normalized
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatStatus(status) {
  if (!status) return 'N/A';
  return STATUS_LABELS[status] || formatLabel(status);
}

function formatUrgency(urgency) {
  if (!urgency) return 'N/A';
  return URGENCY_LABELS[String(urgency).toLowerCase()] || formatLabel(urgency);
}

function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getUpdateTimestamp(update) {
  return update.timestamp || update.created_at;
}

function getOrganizationName(report) {
  return report.organizations?.name || report.organization_name || 'N/A';
}

function getLocation(report) {
  const parts = [report.lga, report.state].filter(Boolean);
  if (parts.length > 0) return parts.join(', ');
  if (report.incident_address) return report.incident_address;
  return 'N/A';
}

function getReportType(report) {
  if (report.is_feedback) return 'Customer Feedback';
  if (report.category === 'Bounty') return 'Bounty Submission';
  return 'Whistleblower Report';
}

function getRewardEligibility(report) {
  if (report.is_anonymous) {
    return 'Anonymous reporter — reward handled via secure credentials';
  }
  if (report.reward_status) {
    return `Reward status: ${formatLabel(report.reward_status)}`;
  }
  return 'Identified reporter';
}

function getAssignedStaffLabel(assignedUsers = []) {
  if (!assignedUsers.length) return 'Unassigned';
  return assignedUsers.map((user) => user.name).filter(Boolean).join(', ');
}

function createPdfContext(pdf) {
  let y = MARGIN_TOP;
  const contentWidth = PAGE_WIDTH - MARGIN_X * 2;

  function setFont(style, size) {
    pdf.setFont(PDF_FONT, style);
    pdf.setFontSize(size);
  }

  function newPage() {
    pdf.addPage();
    y = MARGIN_TOP;
  }

  function ensureSpace(height) {
    if (y + height > CONTENT_BOTTOM) {
      newPage();
    }
  }

  function drawCoverHeader(reportId, organizationName) {
    setFillColor(pdf, BRAND);
    pdf.rect(0, 0, PAGE_WIDTH, 28, 'F');

    setFont('bold', 18);
    setTextColor(pdf, WHITE);
    pdf.text(SITE_NAME, MARGIN_X, 12);

    setFont('normal', 9);
    pdf.text('Confidential report export', MARGIN_X, 20);

    y = 36;
    setFont('bold', 11);
    setTextColor(pdf, INK);
    pdf.text(`Report ID: ${reportId}`, MARGIN_X, y);
    y += 6;

    setFont('normal', 10);
    setTextColor(pdf, MUTED);
    pdf.text(organizationName, MARGIN_X, y);
    y += 5;
    pdf.text(
      `Generated ${formatDate(new Date().toISOString())}`,
      MARGIN_X,
      y,
    );
    y += 10;
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

  function drawMetaGrid(rows) {
    const colWidth = contentWidth / 2 - 4;

    for (let index = 0; index < rows.length; index += 2) {
      const left = rows[index];
      const right = rows[index + 1];
      const leftLines = left
        ? pdf.splitTextToSize(String(left.value || 'N/A'), colWidth)
        : [''];
      const rightLines = right
        ? pdf.splitTextToSize(String(right.value || 'N/A'), colWidth)
        : [''];
      const rowHeight = Math.max(leftLines.length, rightLines.length) * 4.5 + 6;

      ensureSpace(rowHeight);

      if (left) {
        setFont('normal', 8);
        setTextColor(pdf, MUTED);
        pdf.text(left.label, MARGIN_X, y);
        setFont('bold', 9);
        setTextColor(pdf, INK);
        pdf.text(leftLines, MARGIN_X, y + 4);
      }

      if (right) {
        setFont('normal', 8);
        setTextColor(pdf, MUTED);
        pdf.text(right.label, MARGIN_X + colWidth + 8, y);
        setFont('bold', 9);
        setTextColor(pdf, INK);
        pdf.text(rightLines, MARGIN_X + colWidth + 8, y + 4);
      }

      y += rowHeight;
    }
  }

  function drawParagraph(text, options = {}) {
    const {
      size = 10,
      color = INK,
      style = 'normal',
      lineHeight = 4.8,
      indent = 0,
    } = options;
    const normalized = String(text || '').trim() || 'N/A';
    const lines = pdf.splitTextToSize(normalized, contentWidth - indent);

    ensureSpace(lines.length * lineHeight + 2);
    setFont(style, size);
    setTextColor(pdf, color);
    pdf.text(lines, MARGIN_X + indent, y);
    y += lines.length * lineHeight + 4;
  }

  function drawBulletList(items, emptyLabel = 'None') {
    if (!items.length) {
      drawParagraph(emptyLabel, { size: 9, color: MUTED });
      return;
    }

    items.forEach((item) => {
      const lines = pdf.splitTextToSize(`• ${item}`, contentWidth - 4);
      ensureSpace(lines.length * 4.8 + 2);
      setFont('normal', 9);
      setTextColor(pdf, INK);
      pdf.text(lines, MARGIN_X + 2, y);
      y += lines.length * 4.8 + 2;
    });
    y += 2;
  }

  function drawMessageBubble({
    sender,
    message,
    timestamp,
    isReporter,
    replyPreview,
  }) {
    const bubbleWidth = contentWidth * 0.72;
    const x = isReporter ? MARGIN_X : PAGE_WIDTH - MARGIN_X - bubbleWidth;
    const padding = 4;
    const messageLines = pdf.splitTextToSize(message, bubbleWidth - padding * 2);
    const replyLines = replyPreview
      ? pdf.splitTextToSize(replyPreview, bubbleWidth - padding * 2)
      : [];
    const bubbleHeight =
      8 +
      (replyLines.length ? replyLines.length * 4 + 6 : 0) +
      messageLines.length * 4.5 +
      6;

    ensureSpace(bubbleHeight + 4);

    setFillColor(pdf, isReporter ? REPORTER_BUBBLE : BRAND);
    pdf.roundedRect(x, y, bubbleWidth, bubbleHeight, 2, 2, 'F');

    let innerY = y + 5;
    setFont('bold', 8);
    setTextColor(pdf, isReporter ? INK : WHITE);
    pdf.text(sender, x + padding, innerY);
    innerY += 4;

    if (replyLines.length) {
      setFillColor(pdf, isReporter ? SURFACE : { r: 255, g: 120, b: 40 });
      pdf.roundedRect(x + padding, innerY - 2, bubbleWidth - padding * 2, replyLines.length * 4 + 4, 1, 1, 'F');
      setFont('normal', 7.5);
      setTextColor(pdf, isReporter ? MUTED : WHITE);
      pdf.text(replyLines, x + padding + 1, innerY + 2);
      innerY += replyLines.length * 4 + 5;
    }

    setFont('normal', 9);
    setTextColor(pdf, isReporter ? INK : WHITE);
    pdf.text(messageLines, x + padding, innerY + 2);
    innerY += messageLines.length * 4.5 + 3;

    setFont('normal', 7);
    setTextColor(pdf, isReporter ? MUTED : WHITE);
    pdf.text(formatDate(timestamp), x + padding, innerY + 1);

    y += bubbleHeight + 5;
  }

  function drawTimelineItem({ title, subtitle, timestamp, isLast }) {
    const textWidth = contentWidth - 10;
    const titleLines = pdf.splitTextToSize(title, textWidth);
    const subtitleLines = subtitle
      ? pdf.splitTextToSize(subtitle, textWidth)
      : [];
    const itemHeight =
      titleLines.length * 4.5 +
      (subtitleLines.length ? subtitleLines.length * 4 + 2 : 0) +
      8;

    ensureSpace(itemHeight);

    setFillColor(pdf, BRAND);
    pdf.circle(MARGIN_X + 1.5, y + 1.5, 1.5, 'F');

    if (!isLast) {
      setDrawColor(pdf, BORDER);
      pdf.setLineWidth(0.3);
      pdf.line(MARGIN_X + 1.5, y + 3, MARGIN_X + 1.5, y + itemHeight);
    }

    setFont('bold', 9);
    setTextColor(pdf, INK);
    pdf.text(titleLines, MARGIN_X + 6, y + 2);

    let textY = y + 2 + titleLines.length * 4.5;
    if (subtitleLines.length) {
      setFont('normal', 8.5);
      setTextColor(pdf, MUTED);
      pdf.text(subtitleLines, MARGIN_X + 6, textY);
      textY += subtitleLines.length * 4;
    }

    setFont('normal', 7.5);
    setTextColor(pdf, MUTED);
    pdf.text(formatDate(timestamp), MARGIN_X + 6, textY + 2);

    y += itemHeight;
  }

  function drawFooters() {
    const totalPages = pdf.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
      pdf.setPage(page);
      setDrawColor(pdf, BORDER);
      pdf.setLineWidth(0.2);
      pdf.line(MARGIN_X, FOOTER_Y - 4, PAGE_WIDTH - MARGIN_X, FOOTER_Y - 4);

      setFont('normal', 8);
      setTextColor(pdf, MUTED);
      pdf.text(
        'Confidential — for authorized internal use only',
        MARGIN_X,
        FOOTER_Y,
      );
      pdf.text(
        `Page ${page} of ${totalPages}`,
        PAGE_WIDTH - MARGIN_X,
        FOOTER_Y,
        { align: 'right' },
      );
    }
  }

  return {
    drawCoverHeader,
    drawSectionTitle,
    drawMetaGrid,
    drawParagraph,
    drawBulletList,
    drawMessageBubble,
    drawTimelineItem,
    drawFooters,
  };
}

function getReplyPreview(updates, replyToMessageId) {
  if (!replyToMessageId) return null;
  const parent = updates.find((update) => update.id === replyToMessageId);
  if (!parent?.message) return null;
  const preview = parent.message.trim();
  if (preview.length <= 120) return `Replying to: ${preview}`;
  return `Replying to: ${preview.slice(0, 117)}...`;
}

export async function generateReportPdf(payload) {
  const { report, updates = [], attachments = [], voiceNote, assignedUsers = [] } = payload;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  await ensureSpaceGroteskFonts(pdf);

  const ctx = createPdfContext(pdf);
  const organizationName = getOrganizationName(report);
  const chatUpdates = updates.filter((update) => update.message);
  const activityUpdates = updates.filter((update) => update.status_update);

  ctx.drawCoverHeader(report.report_id, organizationName);

  ctx.drawSectionTitle('Overview');
  ctx.drawMetaGrid([
    { label: 'Organization', value: organizationName },
    { label: 'Category', value: report.category || 'N/A' },
    { label: 'Status', value: formatStatus(report.status) },
    { label: 'Urgency', value: formatUrgency(report.urgency) },
    { label: 'State', value: report.state || 'N/A' },
    { label: 'Location', value: getLocation(report) },
    {
      label: 'Submitted',
      value: formatDate(report.submitted_at || report.created_at),
    },
    {
      label: 'Incident Date',
      value: formatDate(report.incident_date),
    },
    { label: 'Reward Eligibility', value: getRewardEligibility(report) },
    { label: 'Assigned Staff', value: getAssignedStaffLabel(assignedUsers) },
    { label: 'Report Type', value: getReportType(report) },
    {
      label: 'Address',
      value: report.incident_address || 'N/A',
    },
  ]);

  ctx.drawSectionTitle('Report Narrative');
  ctx.drawParagraph(report.title, { size: 13, style: 'bold', lineHeight: 5.2 });
  ctx.drawParagraph(report.description, { size: 10 });

  if (voiceNote) {
    ctx.drawSectionTitle('Voice Note');
    ctx.drawParagraph(
      'A voice recording is attached to this report. Playback remains available in the secure dashboard.',
      { size: 9, color: MUTED },
    );
  }

  ctx.drawSectionTitle('Attachments');
  if (attachments.length === 0) {
    ctx.drawParagraph('No attachments included with this report.', {
      size: 9,
      color: MUTED,
    });
  } else {
    ctx.drawBulletList(
      attachments.map((attachment) => {
        const type = getAttachmentPreviewType(attachment);
        const label = getAttachmentTypeLabel(type);
        return `${getAttachmentDisplayName(attachment.file_url)} (${label})`;
      }),
    );
  }

  ctx.drawSectionTitle('Secure Communication Log');
  if (chatUpdates.length === 0) {
    ctx.drawParagraph('No secure messages recorded for this report.', {
      size: 9,
      color: MUTED,
    });
  } else {
    chatUpdates.forEach((update) => {
      const isReporter = !update.updated_by;
      ctx.drawMessageBubble({
        sender: isReporter
          ? 'Reporter'
          : update.users?.name || update.updated_by_user?.name || 'Admin',
        message: update.message,
        timestamp: getUpdateTimestamp(update),
        isReporter,
        replyPreview: getReplyPreview(updates, update.reply_to_message_id),
      });
    });
  }

  ctx.drawSectionTitle('Activity History');
  if (activityUpdates.length === 0) {
    ctx.drawParagraph('No activity history recorded for this report.', {
      size: 9,
      color: MUTED,
    });
  } else {
    activityUpdates.forEach((update, index) => {
      const actor = update.updated_by
        ? update.users?.name || update.updated_by_user?.name || 'Admin'
        : 'Reporter';
      ctx.drawTimelineItem({
        title: update.status_update,
        subtitle: `Updated by ${actor}`,
        timestamp: getUpdateTimestamp(update),
        isLast: index === activityUpdates.length - 1,
      });
    });
  }

  ctx.drawFooters();
  return pdf;
}

export async function downloadReportPdf(payload) {
  const pdf = await generateReportPdf(payload);
  pdf.save(`Report-${payload.report.report_id}.pdf`);
}
