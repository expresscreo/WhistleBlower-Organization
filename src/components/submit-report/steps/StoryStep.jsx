'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { inputFieldClasses, textareaFieldClasses } from '@/lib/fieldStyles';
import DescriptionModeSwitch from '../DescriptionModeSwitch';
import VoiceRecordingWidget from '../VoiceRecordingWidget';

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
}) {
  const handleModeChange = (mode) => {
    if (mode === 'text' && voiceNoteFile) {
      onVoiceNoteClear();
    }
    onDescriptionModeChange(mode);
  };

  return (
    <div className="space-y-5">
      {!isBountyMode && (
        <DescriptionModeSwitch
          mode={descriptionMode}
          onChange={handleModeChange}
        />
      )}

      {descriptionMode === 'text' ? (
        <div className="space-y-4">
          <Input
            id="reportTitle"
            placeholder="Report title, e.g. Suspicious financial activity"
            aria-label="Report title"
            value={formData.title || ''}
            onChange={(e) => handleSelectChange('title', e.target.value)}
            className={inputFieldClasses}
            disabled={isBountyMode && !!formData.title}
          />
          <Textarea
            id="reportDescription"
            placeholder="Describe the incident in detail — include dates, locations, and individuals involved where possible."
            aria-label="Report description"
            value={formData.description || ''}
            onChange={(e) => handleSelectChange('description', e.target.value)}
            className={textareaFieldClasses}
            rows={6}
          />
        </div>
      ) : (
        <VoiceRecordingWidget
          hasOrganization={hasOrganization}
          onRecordingComplete={(blob) => {
            if (blob) {
              onVoiceNoteComplete({
                blob,
                fileName: `voice-report-${Date.now()}.webm`,
                audioFormat: 'webm',
              });
            } else {
              onVoiceNoteClear();
            }
          }}
        />
      )}
    </div>
  );
}
