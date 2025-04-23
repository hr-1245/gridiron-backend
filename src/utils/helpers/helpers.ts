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


export function findBestNameMatch(name: string, existingNames: string[]): string | null {
  if (!name) return null;

  const normalize = (str: string) => str.toLowerCase().trim();
  const nameNorm = normalize(name);

  const exactMatch = existingNames.find(n => normalize(n) === nameNorm);
  if (exactMatch) return exactMatch;

  for (const existingName of existingNames) {
    const normExisting = normalize(existingName);
    if (normExisting.includes(nameNorm) || nameNorm.includes(normExisting)) {
      return existingName;
    }
  }

  const nameParts = nameNorm.split(' ');
  if (nameParts.length >= 2) {
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];

    for (const existingName of existingNames) {
      const existingParts = normalize(existingName).split(' ');
      if (existingParts.length >= 2) {
        const existingFirst = existingParts[0];
        const existingLast = existingParts[existingParts.length - 1];

        if (firstName === existingFirst && lastName === existingLast) {
          return existingName;
        }
      }
    }
  }

  return null;
}

export function areNamesEquivalent(name1: string, name2: string): boolean {
  if (!name1 || !name2) return false;
  const normalize = (name: string) => name.toLowerCase().trim().replace(/\s+/g, ' ');
  const normName1 = normalize(name1);
  const normName2 = normalize(name2);
  if (normName1 === normName2) return true;
  if (normName1.includes(normName2) || normName2.includes(normName1)) return true;
  const parts1 = normName1.split(' ');
  const parts2 = normName2.split(' ');
  if (parts1.length >= 2 && parts2.length >= 2) {
    if (parts1[0] === parts2[0] && parts1[parts1.length - 1] === parts2[parts1.length - 1]) {
      return true;
    }
  }
  return false;
}
