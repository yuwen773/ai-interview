export interface UploadResponse {
  id: number;
  filename: string;
}

export interface ResumeDetail {
  id: number;
  filename: string;
  fileSize: number;
  contentType: string;
  storageUrl: string;
  uploadedAt: string;
  accessCount: number;
  resumeText: string;
  analyzeStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  analyzeError?: string;
  analyses: AnalysisHistory[];
}

export interface AnalysisHistory {
  id: number;
  overallScore: number;
  contentScore: number;
  structureScore: number;
  skillMatchScore: number;
  expressionScore: number;
  projectScore: number;
  summary: string;
  analyzedAt: string;
  strengths: string[];
  suggestions: unknown[];
}
