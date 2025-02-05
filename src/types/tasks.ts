export interface TaskType {
  id?: string;
  houseId: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  frequencyDays?: number;
  durationMonths?: number;
  points: number;
  createdBy: string;
  createdAt: Date;
  active: boolean;
}

export interface Task {
  id?: string;
  houseId: string;
  typeId: string;
  assignedTo: string;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
  rating?: number;
  feedback?: string;
  photos?: string[];
  points: number;
}

export interface UserReputation {
  id?: string;
  houseId: string;
  userId: string;
  points: number;
  tasksCompleted: number;
  tasksDelayed: number;
  averageRating: number;
  level: number;
  badges: string[];
}

export interface TaskRotation {
  id?: string;
  houseId: string;
  taskTypeId: string;
  memberIds: string[];
  startDate: Date;
  endDate: Date;
  frequencyDays: number;
  createdBy: string;
  createdAt: Date;
}