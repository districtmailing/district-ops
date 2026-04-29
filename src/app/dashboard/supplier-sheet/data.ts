export type UploadedSheet = {
  id: string;
  title: string;
  supplier: string;
  uploadedAt: string;
  status: "Active" | "Draft" | "Archived";
  rows: number;
  notes?: string;
};

export const initialSheets: UploadedSheet[] = [
  {
    id: "resmed-april-2026",
    title: "ResMed April 2026",
    supplier: "ResMed",
    uploadedAt: "Apr 16, 2026",
    status: "Active",
    rows: 248,
    notes: "Main supplier sheet for current purchasing and replenishment.",
  },
  {
    id: "country-life-master",
    title: "Country Life Master Sheet",
    supplier: "Country Life",
    uploadedAt: "Apr 14, 2026",
    status: "Draft",
    rows: 132,
    notes: "Needs updated pricing and MOQ review.",
  },
  {
    id: "abc-supply-q2",
    title: "ABC Supply Q2",
    supplier: "ABC Supply",
    uploadedAt: "Apr 10, 2026",
    status: "Archived",
    rows: 89,
    notes: "Older sheet kept for reference.",
  },
];