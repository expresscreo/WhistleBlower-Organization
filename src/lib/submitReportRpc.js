/**
 * Builds RPC args for create_report_with_evidence matching the deployed Supabase function.
 * Password is stored as "hash:salt" in anonymous_password_hash_param (no separate salt param).
 */
export function buildCreateReportRpcParams({
  reportId,
  organizationId = null,
  organizationName = null,
  title,
  description,
  category,
  state,
  lga,
  incidentAddress = null,
  incidentDate = null,
  isAnonymous = true,
  passwordHash = null,
  passwordSalt = null,
  evidencePaths = null,
  reportType = 'text',
  isVoiceNote = false,
  isFeedback = false,
}) {
  let anonymousPasswordHash = null;
  if (passwordHash && passwordSalt) {
    anonymousPasswordHash = `${passwordHash}:${passwordSalt}`;
  } else if (passwordHash) {
    anonymousPasswordHash = passwordHash;
  }

  return {
    report_id_param: reportId,
    organization_id_param: organizationId,
    organization_name_param: organizationName,
    title_param: title,
    description_param: description,
    category_param: category,
    state_param: state || null,
    lga_param: lga || null,
    incident_address_param: incidentAddress,
    incident_date_param: incidentDate || null,
    is_anonymous_param: isAnonymous,
    anonymous_password_hash_param: anonymousPasswordHash,
    evidence_paths_param: evidencePaths?.length ? evidencePaths : null,
    report_type_param: reportType,
    is_voice_note_param: isVoiceNote,
    is_feedback_param: isFeedback,
  };
}
