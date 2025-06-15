export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'intern';
  profile: {
    phone?: string;
    languagePairs: Array<{
      source: string;
      target: string;
    }>;
    specializedFields: string[];
    experience: 'beginner' | 'intermediate' | 'advanced';
    bio?: string;
  };
  statistics: {
    tasksCompleted: number;
    averageScore: number;
    totalScore: number;
    totalEvaluations: number;
  };
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: 'translation' | 'review' | 'proofreading';
  status: 'not_started' | 'in_progress' | 'submitted' | 'under_revision' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: User;
  assignedBy: User;
  sourceLanguage: string;
  targetLanguage: string;
  specializedField?: string;
  sourceDocument?: {
    filename: string;
    originalName: string;
    path: string;
    size: number;
    mimetype: string;
    uploadedAt: string;
  };
  translatedDocument?: {
    filename: string;
    originalName: string;
    path: string;
    size: number;
    mimetype: string;
    uploadedAt: string;
    content?: string;
  };
  instructions?: string;  deadline: string;
  submittedAt?: string;
  completedAt?: string;
  workProgress?: {
    sentences: Array<{
      id: string;
      sourceText: string;
      translatedText: string;
      isCompleted: boolean;
      needsReview: boolean;
      comments: string;
    }>;
    progressPercentage: number;
    workNotes: string;
    lastSaved: string;
  };
  estimatedDuration?: number;
  actualDuration?: number;
  wordCount?: number;
  isOverdue: boolean;
  timeRemaining: number;
  createdAt: string;
  updatedAt: string;
}

export interface Evaluation {
  id: string;
  task: Task;
  evaluatedBy: User;
  intern: User;
  criteria: {
    accuracy: {
      score: number;
      comments?: string;
    };
    grammar: {
      score: number;
      comments?: string;
    };
    style: {
      score: number;
      comments?: string;
    };
    terminology: {
      score: number;
      comments?: string;
    };
    formatting: {
      score: number;
      comments?: string;
    };
    adherence: {
      score: number;
      comments?: string;
    };
  };
  totalScore: number;
  maxScore: number;
  percentage: number;
  overallComments?: string;
  recommendations?: string;
  status: 'draft' | 'completed' | 'sent';
  isRevisionRequired?: boolean;
  revisionInstructions?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  total: number;
}
