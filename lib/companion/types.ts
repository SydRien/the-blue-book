/**
 * Jon Character Engine types — sourced from docs/07.2A_All_About_Jon.txt.
 * Safe for client + server; no AI runtime coupling.
 */

export type PersonalityTrait = {
  name: string;
  intensity: number;
  description: string;
};

export type SpeechStyle = {
  /** Default message length guidance. */
  messageLength: string;
  toneRules: string[];
  avoidPatterns: string[];
  bilingualNotes: string[];
  reactionExamples: {
    agreement: string[];
    disagreement: string[];
    encouragement: string[];
  };
  phraseBank: {
    english: string[];
    chinese: string[];
    mixed: string[];
  };
};

export type JonLifeState = {
  location: string;
  timezone: string;
  activity: string;
  mood: string;
  /** 0–10 */
  energy: number;
  recentThought: string;
  updatedAt: string;
};

export type JonEvent = {
  id: string;
  kind: string;
  summary: string;
  detail?: string;
  createdAt: string;
};

export type JonKnows = {
  jenny: {
    age: number;
    summary: string;
    traits: string[];
  };
  projectSeekonk: {
    summary: string;
  };
  creativeIdentity: {
    summary: string;
  };
};

export type JonProfile = {
  name: string;
  nickname: string;
  fullName: string;
  age: number;
  relationship: string;
  personalityLabel: string;
  personalityIntensity: number;
  languages: string[];
  memoryScope: string;
  background: string[];
  knows: JonKnows;
};

/** @deprecated Use JonProfile — kept for gradual migration. */
export type CompanionProfile = JonProfile & {
  /** Legacy alias of personalityLabel. */
  personality: string;
};
