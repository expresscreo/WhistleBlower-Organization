'use client';

import EvidenceUpload from '../EvidenceUpload';

export default function EvidenceStep({
  files,
  onFilesChange,
  hasOrganization,
  disabled,
}) {
  return (
    <EvidenceUpload
      files={files}
      onFilesChange={onFilesChange}
      hasOrganization={hasOrganization}
      disabled={disabled}
    />
  );
}
