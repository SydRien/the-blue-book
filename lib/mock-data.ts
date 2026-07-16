export type MockDocument = {
  id: string;
  name: string;
};

export type MockProject = {
  id: string;
  name: string;
  documents: MockDocument[];
};

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: "proj-chengpu",
    name: "Chengpu Battle VR",
    documents: [
      { id: "doc-script", name: "Script" },
      { id: "doc-characters", name: "Characters" },
      { id: "doc-notes", name: "Notes" },
    ],
  },
  {
    id: "proj-gray-waves",
    name: "Gray Waves",
    documents: [
      { id: "doc-gw-script", name: "Script" },
      { id: "doc-gw-research", name: "Research" },
    ],
  },
];

export const FONT_OPTIONS = ["Courier New", "IBM Plex Mono", "Space Mono"];
export const SIZE_OPTIONS = [10, 11, 12, 14, 16];
