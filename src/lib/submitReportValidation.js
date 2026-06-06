export function validateStepById(stepId, context) {
  const {
    formData,
    descriptionMode,
    voiceNoteFile,
    isFeedbackMode,
    hasLgasForState,
    isBountyMode,
    isMostWantedMode,
  } = context;

  switch (stepId) {
    case 'organization': {
      if (isBountyMode || isMostWantedMode) return { valid: true };
      const orgName = formData.organization?.label?.trim();
      if (!orgName || orgName.length < 3) {
        return {
          valid: false,
          title: 'Organization required',
          description:
            'Please enter your organization name (at least 3 characters). Select a match or use your typed name.',
          focusId: 'companyName',
        };
      }
      return { valid: true };
    }
    case 'context': {
      if (!formData.category?.trim()) {
        return {
          valid: false,
          title: 'Category required',
          description: 'Please select a category for your report.',
          focusId: 'category',
        };
      }
      if (!formData.stateOfIncident?.trim()) {
        return {
          valid: false,
          title: 'State required',
          description: isBountyMode
            ? 'Please select the state where you observed this.'
            : 'Please select the state where the incident occurred.',
          focusId: 'stateOfIncident',
        };
      }
      if (hasLgasForState && !formData.lga?.trim()) {
        return {
          valid: false,
          title: 'LGA required',
          description: 'Please select the local government area.',
          focusId: 'lga',
        };
      }
      if (!isBountyMode && !formData.dateOfIncident) {
        return {
          valid: false,
          title: 'Date required',
          description: 'Please select when the incident occurred.',
          focusId: 'dateOfIncident',
        };
      }
      if (isMostWantedMode && !formData.timeSeen?.trim()) {
        return {
          valid: false,
          title: 'Time required',
          description: 'Please provide the time you saw this person.',
          focusId: 'timeSeen',
        };
      }
      return { valid: true };
    }
    case 'match': {
      if (!Array.isArray(formData.mostWantedIdentifiers) || formData.mostWantedIdentifiers.length === 0) {
        return {
          valid: false,
          title: 'Match details required',
          description: 'Select at least one identifier that matched the alert.',
          focusId: 'mostWantedIdentifiers',
        };
      }
      return { valid: true };
    }
    case 'story': {
      if (isMostWantedMode && descriptionMode === 'voice') {
        return {
          valid: false,
          title: 'Text description required',
          description: 'Most Wanted tips currently require text details.',
          focusId: 'reportDescription',
        };
      }
      if (descriptionMode === 'voice') {
        if (!voiceNoteFile?.blob) {
          return {
            valid: false,
            title: 'Voice note required',
            description: 'Please record a voice note before continuing.',
            focusId: 'voice-recorder',
          };
        }
        return { valid: true };
      }
      if (!formData.title?.trim()) {
        return {
          valid: false,
          title: 'Title required',
          description: isBountyMode
            ? 'Please confirm the bounty title.'
            : 'Please enter a title for your report.',
          focusId: 'reportTitle',
        };
      }
      if (!formData.description?.trim()) {
        return {
          valid: false,
          title: 'Description required',
          description: isBountyMode
            ? 'Please describe the information you have about this bounty.'
            : 'Please provide a detailed description.',
          focusId: 'reportDescription',
        };
      }
      return { valid: true };
    }
    case 'evidence':
      return { valid: true };
    case 'finish': {
      if (!isFeedbackMode) {
        const pwd = formData.anonymousPassword || '';
        const confirm = formData.confirmPassword || '';
        if (pwd.length < 8) {
          return {
            valid: false,
            title: 'Password too short',
            description: 'Password must be at least 8 characters.',
            focusId: 'anonymousPassword',
          };
        }
        if (pwd !== confirm) {
          return {
            valid: false,
            title: 'Passwords do not match',
            description: 'Please ensure both passwords match.',
            focusId: 'confirmPassword',
          };
        }
      }
      if (!formData.agreeTerms) {
        return {
          valid: false,
          title: 'Terms required',
          description: 'You must agree to the terms and conditions.',
          focusId: 'agreeTerms',
        };
      }
      return { valid: true };
    }
    default:
      return { valid: true };
  }
}

/** @deprecated Use validateStepById with step id from submitReportStepMeta */
export function validateStep(step, context) {
  const stepIds = ['organization', 'context', 'match', 'story', 'evidence', 'finish'];
  return validateStepById(stepIds[step - 1], context);
}

export function validateAllSteps(context, steps) {
  const stepList = steps || [
    { id: 'organization' },
    { id: 'context' },
    { id: 'story' },
    { id: 'evidence' },
    { id: 'finish' },
  ];

  for (let i = 0; i < stepList.length; i += 1) {
    const result = validateStepById(stepList[i].id, context);
    if (!result.valid) {
      return { ...result, step: i + 1, stepId: stepList[i].id };
    }
  }
  return { valid: true };
}
