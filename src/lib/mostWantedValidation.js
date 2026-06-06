import nigerianStatesAndLgas from '@/data/nigerianStatesAndLgas.json';
import { buildMostWantedHeadline, normalizeMostWantedDetails } from '@/lib/mostWantedUtils';

const resolveHasLgasForState = (state, hasLgasForState) => {
  if (typeof hasLgasForState === 'boolean') return hasLgasForState;
  if (!state?.trim()) return false;
  const selected = nigerianStatesAndLgas.find((s) => s.state === state);
  return (selected?.lgas?.length ?? 0) > 0;
};

export function validateMostWantedStep(stepId, context) {
  const { details, title, hasFeaturedImage, hasLgasForState } = context;
  const d = normalizeMostWantedDetails(details);
  const lgaRequired = resolveHasLgasForState(d.crime_state, hasLgasForState);

  switch (stepId) {
    case 'case_facts': {
      if (!d.crime_type?.trim()) {
        return {
          valid: false,
          title: 'Crime type required',
          description: 'Select or enter the type of crime.',
          focusId: 'mw-crime-type',
        };
      }
      if (!d.crime_state?.trim()) {
        return {
          valid: false,
          title: 'State required',
          description: 'Select the state where the crime occurred.',
          focusId: 'mw-crime-state',
        };
      }
      if (lgaRequired && !d.crime_lga?.trim()) {
        return {
          valid: false,
          title: 'LGA required',
          description: 'Select the local government area.',
          focusId: 'mw-crime-lga',
        };
      }
      if (!d.law_enforcement?.trim()) {
        return {
          valid: false,
          title: 'Law enforcement required',
          description: 'Select the investigating agency.',
          focusId: 'mw-law-enforcement',
        };
      }
      if (d.law_enforcement === 'Other Law Enforcement' && !d.law_enforcement_other?.trim()) {
        return {
          valid: false,
          title: 'Agency name required',
          description: 'Specify the law enforcement agency.',
          focusId: 'mw-law-enforcement-other',
        };
      }
      return { valid: true };
    }
    case 'identity': {
      if (!d.crime_type?.trim()) {
        return {
          valid: false,
          title: 'Crime type required',
          description: 'Go back and select a crime type on the report step.',
          focusId: 'mw-crime-type',
        };
      }
      if (!d.suspect_name?.trim()) {
        return {
          valid: false,
          title: 'Suspect name required',
          description: 'Enter the suspect’s full name.',
          focusId: 'mw-suspect-name',
        };
      }
      if (!buildMostWantedHeadline(d)?.trim()) {
        return {
          valid: false,
          title: 'Headline could not be generated',
          description: 'Enter a suspect name to generate the public headline.',
          focusId: 'mw-suspect-name',
        };
      }
      return { valid: true };
    }
    case 'physical': {
      if (!d.whereabouts?.trim()) {
        return {
          valid: false,
          title: 'Whereabouts required',
          description: 'Enter last known location or whereabouts.',
          focusId: 'mw-whereabouts',
        };
      }
      if (!d.sex?.trim()) {
        return {
          valid: false,
          title: 'Sex required',
          description: 'Select the suspect’s sex.',
          focusId: 'mw-sex',
        };
      }
      return { valid: true };
    }
    case 'narrative': {
      if (!d.full_details?.trim()) {
        return {
          valid: false,
          title: 'Full details required',
          description: 'Provide the full report details.',
          focusId: 'mw-full-details',
        };
      }
      return { valid: true };
    }
    case 'media': {
      if (!hasFeaturedImage) {
        return {
          valid: false,
          title: 'Featured image required',
          description: 'Upload a primary photo for this alert.',
          focusId: 'mw-featured-image',
        };
      }
      return { valid: true };
    }
    case 'review':
      return { valid: true };
    default:
      return { valid: true };
  }
}

export function validateMostWantedForSave(context) {
  const steps = ['case_facts', 'identity', 'physical', 'narrative', 'media'];
  for (const stepId of steps) {
    const result = validateMostWantedStep(stepId, context);
    if (!result.valid) return result;
  }
  return { valid: true };
}
