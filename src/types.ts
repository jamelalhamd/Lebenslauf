export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  street?: string;
  houseNumber?: string;
  github?: string;
  linkedin?: string;
  photoUrl?: string;
  photoPublicId?: string;
  bio: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  level: number;
}

export interface Language {
  id: string;
  name: string;
  level: string;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  date: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileMimeType?: string;
  filePublicId?: string;
  fileResourceType?: 'image' | 'raw';
}

export interface CVData {
  personalInfo: PersonalInfo;
  experiences: Experience[];
  skills: Skill[];
  languages: Language[];
  certificates: Certificate[];
}

export type EditSection = 
  | 'personalInfo' 
  | 'experience' 
  | 'skills' 
  | 'languages' 
  | 'certificate'
  | null;

export type ModalType = 'edit' | 'viewCertificate' | 'confirmDelete' | null;

export interface MediaFile {
  id: string;
  url: string;
  publicId: string;
  name: string;
  type: 'image' | 'document';
  resourceType: 'image' | 'raw';
  mimeType: string;
  size: number;
  uploadedAt: string;
}
