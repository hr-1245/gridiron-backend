import { COLLAGE_AGE_ENUM } from "src/types/enums/roles";

export function parseHeightString(heightStr: string): string | null {
  if (!heightStr) return null;
  const formattedMatch = heightStr.match(/^(\d+)'(\d+)?"?$/);
  if (formattedMatch) {
    const feet = formattedMatch[1];
    const inches = formattedMatch[2] || '0';
    return `${feet}'${inches}`;
  }
  const inches = parseInt(heightStr, 10);
  if (!isNaN(inches)) {
    return heightStr;
  }
  return null;
}

export function parseWeightString(weightStr: string): number | null {
  if (!weightStr) return null;
  const num = parseInt(weightStr.replace(/[^\d]/g, ''), 10);
  return isNaN(num) ? null : num;
}

export function extractDraftRound(reason: string): number | null {
  if (!reason) return null;
  const match = reason.match(/(?:Projected Round|Round)\s*(\d+)/i) ||
    reason.match(/Pro Draft \(Projected Round (\d+)\)/i);
  return match ? parseInt(match[1], 10) : null;
}

export function normalizeClassString(input: string): COLLAGE_AGE_ENUM | null {
  if (!input) return null;
  const normalized = input.toUpperCase().replace(/\s/g, '');
  const map: Record<string, COLLAGE_AGE_ENUM> = {
    'SO(RS)': COLLAGE_AGE_ENUM.SO_RS,
    'SORS': COLLAGE_AGE_ENUM.SO_RS,
    'JR': COLLAGE_AGE_ENUM.JR,
    'JR(RS)': COLLAGE_AGE_ENUM.JR_RS,
    'JRRS': COLLAGE_AGE_ENUM.JR_RS,
    'SR': COLLAGE_AGE_ENUM.SR,
    'SR(RS)': COLLAGE_AGE_ENUM.SR_RS,
    'SRRS': COLLAGE_AGE_ENUM.SR_RS,
  };
  return map[normalized] ?? null;
}


export function findBestNameMatch(attrName: string, bioNames: string[]): string | null {
  if (!attrName) return null;

  const normalizedAttrName = attrName.toLowerCase();

  // First, try exact match
  const exactMatch = bioNames.find(name => name === normalizedAttrName);
  if (exactMatch) return exactMatch;

  // Next, try if one name contains the other
  for (const bioName of bioNames) {
    if (bioName.includes(normalizedAttrName) || normalizedAttrName.includes(bioName)) {
      return bioName;
    }
  }

  // Try more flexible matching - last name match
  const attrNameParts = normalizedAttrName.split(' ');
  const attrLastName = attrNameParts[attrNameParts.length - 1];

  for (const bioName of bioNames) {
    const bioNameParts = bioName.split(' ');
    const bioLastName = bioNameParts[bioNameParts.length - 1];

    if (bioLastName === attrLastName) {
      return bioName;
    }
  }

  // If still no matches, try partial last name match
  for (const bioName of bioNames) {
    const bioNameParts = bioName.split(' ');
    const bioLastName = bioNameParts[bioNameParts.length - 1];

    if (bioLastName.includes(attrLastName) || attrLastName.includes(bioLastName)) {
      return bioName;
    }
  }

  return null;
}