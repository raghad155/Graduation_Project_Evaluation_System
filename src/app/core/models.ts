export type UserRole = 'admin' | 'supervisor' | 'committee_chair' | 'committee_member';

export interface AppUser {
  id: number;
  name: string;
  username: string;
  email: string;
  role: UserRole;       // الدور الأساسي (لتحديد الصفحة الرئيسية والـ guard)
  roles: UserRole[];    // جميع الأدوار (للصلاحيات المتعددة)
  roleLabel: string;
  full_name?: string;
  [key: string]: unknown;
}

export interface LoginCredentials {
  login: string;
  password: string;
}

export interface StatCard {
  title: string;
  value: string;
  note: string;
  tone?: 'primary' | 'accent' | 'warning' | 'danger';
}

export interface BaseRecord {
  id: number;
}

export interface SpecializationRecord extends BaseRecord {
  name_en: string;
  name_ar: string;
}

export interface CommitteeRecord extends BaseRecord {
  name: string;
  users?: AppUser[];
  projects?: ProjectRecord[];
}

export interface StudentRecord extends BaseRecord {
  fullName: string;
  academicNumber: string;
  specialization: number | string;
  projectId: number | null;
  [key: string]: unknown; // <-- أضف هذا السطر المقذوف ليحل المشكلة تماماً
}

export interface SupervisorRecord {
  id: number;
  fullName: string;
  phoneNumber: string;
  department: number | string;
  activeProjects: number;
  [key: string]: unknown; // <-- أضف هذا السطر المقذوف ليحل المشكلة تماماً
}

export interface DepartmentOption {
  value: string | number;
  labelEn: string;
  labelAr: string;
}

export interface ProjectRecord extends BaseRecord {
  title: string;
  description?: string;
  specialization_id?: number | null;
  supervisor_id?: number | null;
  committee_id?: number | null;
  academic_year?: string;
  max_students?: number;
  is_locked?: boolean;
  students?: StudentRecord[];
  supervisor?: SupervisorRecord;
  specialization?: SpecializationRecord;
  committee?: CommitteeRecord;
  [key: string]: unknown;
}

export interface ProjectMemberRecord {
  id: number;
  projectId: number;
  studentId: number;
  notes: string;
  joinedAt: string;
  [key: string]: unknown; // <-- أضف هذا السطر المقذوف ليحل المشكلة تماماً
}

export interface EvaluationItemRecord {
  id: number;
  title: string;
  description: string;
  maxScore: number;
  [key: string]: unknown; // <-- أضف هذا السطر المقذوف ليحل المشكلة تماماً

}

export interface EvaluationCriterionRecord {
  id: number;
  title: string;
  weight: number;
  items: EvaluationItemRecord[];
  [key: string]: unknown; // <-- أضف هذا السطر المقذوف ليحل المشكلة تماماً

}

export interface EvaluationGroupRecord {
  id: number;
  title: string;
  description: string;
  specialization_id?: number | null;
  specialization?: SpecializationRecord;
  weight: number;
  criteria: EvaluationCriterionRecord[];
  [key: string]: unknown;
}

export interface ProjectScoreRecord {
  projectId: number;
  studentId: number | null;
  itemId: number;
  score: number;
  notes: string;
  [key: string]: unknown; // <-- أضف هذا السطر المقذوف ليحل المشكلة تماماً

}

export interface ImportResult {
  type: 'success' | 'error';
  message: string;
  details: string[];

}

export interface FeedbackRecord {
  id: number;
  evaluation_id: number;
  user_id: number;
  content: string;
  created_at: string;
  user?: {
    id: number;
    full_name: string;
    email: string;
    role: string;
  };
  [key: string]: unknown;
}

export interface CommitteeRecord {
  id: number;
  name: string;
  members: Array<{
    id: number;
    name: string;
    role: string;
  }>;
}

export interface AuditLogRecord {
  id: number;
  user_id: number | null;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
  };
}
