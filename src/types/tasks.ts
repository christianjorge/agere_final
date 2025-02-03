export interface TaskType {
    id?: string;
    name: string;
    description: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    frequencyDays?: number; // Número de dias entre cada execução
    durationMonths?: number; // Duração em meses para rotação automática
    points: number;
    createdBy: string;
    createdAt: Date;
    active: boolean;
  }
  
  export interface Task {
    id?: string;
    typeId: string;
    assignedTo: string;
    dueDate: Date;
    completed: boolean;
    completedAt?: Date;
    verifiedBy?: string;
    verifiedAt?: Date;
    rating?: number; // 1-5 estrelas para avaliação da qualidade
    feedback?: string;
    photos?: string[]; // URLs das fotos do antes/depois
    points: number;
  }
  
  export interface UserReputation {
    id?: string;
    userId: string;
    points: number;
    tasksCompleted: number;
    tasksDelayed: number;
    averageRating: number;
    level: number; // Nível baseado nos pontos
    badges: string[]; // Conquistas desbloqueadas
  }
  
  export interface TaskRotation {
    id?: string;
    taskTypeId: string;
    memberIds: string[];
    startDate: Date;
    endDate: Date;
    frequencyDays: number;
    createdBy: string;
    createdAt: Date;
  }