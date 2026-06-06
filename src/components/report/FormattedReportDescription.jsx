'use client';

import React from 'react';

const MOST_WANTED_MARKER = '--- Most Wanted Sighting Details ---';
const UPDATE_MARKER_PATTERN = /^---\s*UPDATE\s*\((.+)\)\s*---$/i;

function SectionDivider({ label }) {
  return (
    <div className="my-4 flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      <span className="whitespace-nowrap">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export default function FormattedReportDescription({ text = '' }) {
  const lines = String(text || '').split('\n');
  let inMostWantedBlock = false;

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (trimmed === MOST_WANTED_MARKER) {
          inMostWantedBlock = true;
          return (
            <SectionDivider
              key={`mw-marker-${index}`}
              label="Most Wanted Sighting Details"
            />
          );
        }

        const updateMatch = trimmed.match(UPDATE_MARKER_PATTERN);
        if (updateMatch) {
          const updateLabel = updateMatch[1]?.trim()
            ? `Update (${updateMatch[1].trim()})`
            : 'Update';
          return (
            <SectionDivider
              key={`update-marker-${index}`}
              label={updateLabel}
            />
          );
        }

        // Keep traceability info in stored text, but hide it from reporter-facing views.
        if (
          inMostWantedBlock &&
          (/^Alert:\s/i.test(trimmed) ||
            /^Alert ID:\s/i.test(trimmed) ||
            /^Report ID:\s/i.test(trimmed))
        ) {
          return null;
        }

        if (trimmed.length === 0) {
          return <div key={`spacer-${index}`} className="h-2" />;
        }
        return (
          <p key={`line-${index}`} className="whitespace-pre-wrap">
            {line}
          </p>
        );
      })}
    </div>
  );
}
