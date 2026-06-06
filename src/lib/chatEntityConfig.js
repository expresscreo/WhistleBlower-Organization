export const REPORT_CHAT_CONFIG = {
  updatesTable: 'report_updates',
  entityIdColumn: 'report_id',
  parentTable: 'reports',
  markReadRpc: 'mark_messages_as_read',
  buildMarkReadArgs: (entityId, readerId = null) => ({
    p_report_id: entityId,
    p_reader_id: readerId,
  }),
  placerLabel: 'You',
  adminLabel: 'Admin',
  placerDisplayName: 'Reporter',
  readByPlacerField: 'is_read_by_reporter',
  placerHasViewedField: 'reporter_has_viewed',
  adminHasViewedField: 'admin_has_viewed',
};

export const BOUNTY_CHAT_CONFIG = {
  updatesTable: 'bounty_updates',
  entityIdColumn: 'bounty_id',
  parentTable: 'bounties',
  markReadRpc: 'mark_bounty_messages_as_read',
  buildMarkReadArgs: (entityId, readerId = null) => ({
    p_bounty_id: entityId,
    p_reader_id: readerId,
  }),
  placerLabel: 'You',
  adminLabel: 'Admin',
  placerDisplayName: 'Bounty placer',
  readByPlacerField: 'is_read_by_placer',
  placerHasViewedField: 'placer_has_viewed',
  adminHasViewedField: 'admin_has_viewed',
};
