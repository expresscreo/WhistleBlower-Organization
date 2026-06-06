export function validatePlaceBountyStep(stepId, context) {
  const { formData, hasLgasForState } = context;

  switch (stepId) {
    case 'case': {
      if (!formData.title?.trim()) {
        return {
          valid: false,
          title: 'Title required',
          description: 'Please enter a title for your bounty.',
          focusId: 'bounty-title',
        };
      }
      if (!formData.description?.trim()) {
        return {
          valid: false,
          title: 'Description required',
          description: 'Please provide a suspect or subject description.',
          focusId: 'bounty-description',
        };
      }
      if (!formData.typeOfCrime?.trim()) {
        return {
          valid: false,
          title: 'Crime type required',
          description: 'Please select the type of crime.',
          focusId: 'bounty-crime-type',
        };
      }
      return { valid: true };
    }
    case 'location': {
      if (!formData.state?.trim()) {
        return {
          valid: false,
          title: 'State required',
          description: 'Please select the state where the incident occurred.',
          focusId: 'bounty-state',
        };
      }
      if (hasLgasForState && !formData.lga?.trim()) {
        return {
          valid: false,
          title: 'LGA required',
          description: 'Please select the local government area.',
          focusId: 'bounty-lga',
        };
      }
      if (!formData.dateOfIncident) {
        return {
          valid: false,
          title: 'Date required',
          description: 'Please provide the date of incident.',
          focusId: 'bounty-incident-date',
        };
      }
      return { valid: true };
    }
    case 'evidence': {
      if (!formData.evidenceFiles?.length) {
        return {
          valid: false,
          title: 'Evidence required',
          description: 'Please attach at least one supporting file for your bounty.',
          focusId: 'bounty-file-upload',
        };
      }
      return { valid: true };
    }
    case 'reward': {
      const amount = (formData.bountyAmount || '').replace(/,/g, '').trim();
      if (!amount || Number(amount) <= 0) {
        return {
          valid: false,
          title: 'Amount required',
          description: 'Please enter a valid bounty amount.',
          focusId: 'bounty-amount',
        };
      }
      return { valid: true };
    }
    case 'finish': {
      const pwd = formData.password || '';
      const confirm = formData.confirmPassword || '';
      if (pwd.length < 8) {
        return {
          valid: false,
          title: 'Password too short',
          description: 'Password must be at least 8 characters.',
          focusId: 'bounty-password',
        };
      }
      if (pwd !== confirm) {
        return {
          valid: false,
          title: 'Passwords do not match',
          description: 'Please ensure both passwords match.',
          focusId: 'bounty-confirm-password',
        };
      }
      if (!formData.agreeTerms) {
        return {
          valid: false,
          title: 'Terms required',
          description: 'You must agree to the terms and conditions.',
          focusId: 'bounty-terms',
        };
      }
      return { valid: true };
    }
    default:
      return { valid: true };
  }
}

export function validateAllPlaceBountySteps(context, steps) {
  for (let i = 0; i < steps.length; i += 1) {
    const result = validatePlaceBountyStep(steps[i].id, context);
    if (!result.valid) {
      return { ...result, step: i + 1, stepId: steps[i].id };
    }
  }
  return { valid: true };
}
