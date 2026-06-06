'use client';

import EvidenceUpload from '../EvidenceUpload';

export default function EvidenceStep({
  files,
  onFilesChange,
  hasOrganization,
  disabled,
  isBountyMode = false,
}) {
  return (
    <EvidenceUpload
      files={files}
      onFilesChange={onFilesChange}
      hasOrganization={hasOrganization}
      disabled={disabled}
      isBountyMode={isBountyMode}
    />
  );
}
