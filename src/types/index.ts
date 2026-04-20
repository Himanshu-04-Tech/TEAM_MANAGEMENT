export type UserRole = 'faculty' | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  facultyId: string;
  createdAt: string;
}

export interface Team {
  id: string;
  projectId: string;
  name: string;
  joinCode: string;
  facultyId: string;
  studentIds: string[];
  riskLevel: 'low' | 'medium' | 'high';
  riskDescription?: string;
  effortEstimation: number; // in hours or percentage
  createdAt: string;
}

export type TaskStatus = 'todo' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  teamId: string;
  projectId: string;
  title: string;
  description: string;
  deadline: string;
  status: TaskStatus;
  assignedTo?: string; // student uid
  effortHours: number;
  createdAt: string;
  updatedAt: string;
}
