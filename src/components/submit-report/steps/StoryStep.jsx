'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { inputFieldClasses, textareaFieldClasses } from '@/lib/fieldStyles';
import DescriptionModeSwitch from '../DescriptionModeSwitch';
import VoiceRecordingWidget from '../VoiceRecordingWidget';
import { FieldError } from '@/components/ui/form-feedback';
import { TipFieldGroup } from '../TipFieldLabel';

export default function StoryStep({
  formData,
  handleSelectChange,
  descriptionMode,
  onDescriptionModeChange,
  voiceNoteFile,
  onVoiceNoteComplete,
  onVoiceNoteClear,
  hasOrganization,
  isBountyMode,
  isMostWantedMode,
  fieldErrors = {},
}) {
  const voiceNotes = Array.isArray(voiceNoteFile) ? voiceNoteFile : voiceNoteFile ? [voiceNoteFile] : [];

  const handleModeChange = (mode) => {
    if (mode === 'text' && voiceNotes.length) {
      onVoiceNoteClear();
    }
    onDescriptionModeChange(mode);
  };

  return (
    <div className="space-y-5">
      {!isBountyMode && !isMostWantedMode && (
        <DescriptionModeSwitch
          mode={descriptionMode}
          onChange={handleModeChange}
        />
      )}

      {descriptionMode === 'text' ? (
        <div className="space-y-4">
          <TipFieldGroup
            isBountyMode={isBountyMode || isMostWantedMode}
            label={isMostWantedMode ? 'Alert title' : 'Bounty subject'}
            htmlFor="reportTitle"
          >
            <Input
              id="reportTitle"
              placeholder={
                isMostWantedMode
                  ? 'Most Wanted alert title'
                  : isBountyMode
                  ? 'Bounty title'
                  : 'Report title, e.g. Suspicious financial activity'
              }
              aria-label="Report title"
              value={formData.title || ''}
              onChange={(e) => handleSelectChange('title', e.target.value)}
              className={inputFieldClasses}
              disabled={(isBountyMode || isMostWantedMode) && !!formData.title}
            />
            <FieldError message={fieldErrors.title} />
          </TipFieldGroup>
          <TipFieldGroup
            isBountyMode={isBountyMode || isMostWantedMode}
            label={isMostWantedMode ? 'Give full details of what you observed' : 'What you know'}
            htmlFor="reportDescription"
          >
            <Textarea
              id="reportDescription"
              placeholder={
                isMostWantedMode
                  ? 'Describe what you observed about the person, what matched the alert, and any immediate risk details.'
                  : isBountyMode
                  ? 'Describe what you saw, heard, or know — include location, timing, and any details that could help.'
                  : 'Describe the incident in detail — include dates, locations, and individuals involved where possible.'
              }
              aria-label="Report description"
              value={formData.description || ''}
              onChange={(e) => handleSelectChange('description', e.target.value)}
              className={textareaFieldClasses}
              rows={6}
            />
            <FieldError message={fieldErrors.description} />
          </TipFieldGroup>
        </div>
      ) : (
        <VoiceRecordingWidget
          hasOrganization={hasOrganization}
          voiceNotes={voiceNotes}
          onVoiceNoteAdd={onVoiceNoteComplete}
          onVoiceNoteDelete={onVoiceNoteClear}
        />
      )}
      {descriptionMode === 'voice' && (
        <FieldError message={fieldErrors.voice} className="mt-2" />
      )}
    </div>
  );
}
