export interface GeneratePlanningDto {
  semestreNom?: string;
  mentionNom?: string;
  semaineDu?: string; // Date début semaine
  maxHeuresParMatiere?: number;
}

export interface GenerationSummaryDto {
  success: boolean;
  generatedSessionsCount: number;
  totalPlannedHours: number;
  message: string;
  skippedCourses: Array<{
    codeMatiere: string;
    nomMatiere: string;
    motif: string;
  }>;
}
