export enum BlockType {
  TEXT = 'text',
  IMAGE = 'image',
}

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: string; // Text content or Image Base64/URL
}

export interface ReportSection {
  id: string;
  title: string;
  blocks: ContentBlock[];
  isLocked: boolean; // If true, requires regeneration to change automatically
}

export interface InstitutionSettings {
  logoLeft: string | null;
  logoRight: string | null;
  institutionName: string;
  departmentName: string;
}

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // Base64 string without prefix
}

export interface ProjectDetails {
  studentName: string;
  studentId: string; // No de control
  career: string;
  projectTitle: string;
  companyName: string;
  advisorInternal: string;
  advisorExternal: string;
  startDate: string;
  endDate: string;
  problemStatement: string; // Problematica
  objectives: string;
  activities: string; // List of activities
  resultsExpected: string;
  areaCharacterization: string; // Context of the area
  attachments: Attachment[]; // New field for reference documents
}

export type SectionKey = 
  | 'portada'
  | 'indice'
  | 'introduccion'
  | 'justificacion'
  | 'objetivos'
  | 'caracterizacion'
  | 'problemas'
  | 'alcances'
  | 'fundamento'
  | 'procedimiento'
  | 'resultados'
  | 'conclusiones'
  | 'referencias';

export const SECTION_TITLES: Record<SectionKey, string> = {
  portada: 'Portada',
  indice: 'Índice',
  introduccion: 'Introducción',
  justificacion: 'Justificación',
  objetivos: 'Objetivos',
  caracterizacion: 'Caracterización del Área',
  problemas: 'Problemas a Resolver',
  alcances: 'Alcances y Limitaciones',
  fundamento: 'Fundamento Teórico',
  procedimiento: 'Procedimiento y Actividades',
  resultados: 'Resultados',
  conclusiones: 'Conclusiones y Recomendaciones',
  referencias: 'Referencias Bibliográficas',
};