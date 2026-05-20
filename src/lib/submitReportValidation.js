export function validateStep(step, context) {
  const {
    formData,
    descriptionMode,
    voiceNoteFile,
    isFeedbackMode,
    hasLgasForState,
    isBountyMode,
  } = context;

  switch (step) {
    case 1: {
      if (!formData.organization?.value) {
        return {
          valid: false,
          title: 'Organization required',
          description: 'Please search for and select an organization.',
          focusId: 'companyName',
        };
      }
      return { valid: true };
    }
    case 2: {
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
          description: 'Please select the state where the incident occurred.',
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
      if (!formData.dateOfIncident) {
        return {
          valid: false,
          title: 'Date required',
          description: 'Please select when the incident occurred.',
          focusId: 'dateOfIncident',
        };
      }
      return { valid: true };
    }
    case 3: {
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
          description: 'Please enter a title for your report.',
          focusId: 'reportTitle',
        };
      }
      if (!formData.description?.trim()) {
        return {
          valid: false,
          title: 'Description required',
          description: 'Please provide a detailed description.',
          focusId: 'reportDescription',
        };
      }
      return { valid: true };
    }
    case 4:
      return { valid: true };
    case 5: {
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

export function validateAllSteps(context) {
  for (let step = 1; step <= 5; step += 1) {
    const result = validateStep(step, context);
    if (!result.valid) return { ...result, step };
  }
  return { valid: true };
}
