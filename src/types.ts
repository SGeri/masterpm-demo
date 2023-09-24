export type Ticket = {
  title: string;
  description: string;
  expectedWorkHours: number;
  seniority: "junior" | "medior" | "senior";
  role: string;
};

export type Role = {
  name: string;
  hourlyRate: number;
};

export type SummaryEntry = {
  role: string;
  workHours: number;
  hourlyRate: number;
};
