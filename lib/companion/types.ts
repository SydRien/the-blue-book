/**
 * Companion profile — personality config only.
 * Editor must never import AI runtime; profile is safe to share.
 */

export type CompanionProfile = {
  name: string;
  nickname: string;
  age: number;
  relationship: string;
  personality: string;
  languages: string[];
  personalityIntensity: number;
  memoryScope: string;
};
