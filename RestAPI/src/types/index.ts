/**
 * TypeScript Type Definitions for the LeetCode Platform API
 */

// ============== Auth Types ==============
export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user_id: string;
    username: string;
    email: string;
    is_admin: boolean;
  };
  token?: string;
}

// ============== User Types ==============
export interface User {
  user_id: string;
  username: string;
  email: string;
  user_level: string;
  is_admin: boolean;
}

export interface JWTPayload {
  user_id: string;
  username: string;
  is_admin: boolean;
}

// ============== Problem Types ==============
export interface Problem {
  problem_id: number;
  name: string;
  difficulty_level: 'easy' | 'med' | 'hard';
  solve_rate: number;
  visibility?: 'HIDDEN' | 'CONTEST_ONLY' | 'PUBLIC';
  is_published?: boolean;
  description?: string;
  topics?: string[];
}

export interface ProblemDetails extends Problem {
  description: string;
  examples?: Example[];
  constraints?: string;
  public_test_cases: TestCase[]; // Only public cases returned
}

export interface CreateProblemRequest {
  name: string;
  description: string;
  difficulty_level: 'easy' | 'med' | 'hard';
  visibility?: 'HIDDEN' | 'CONTEST_ONLY' | 'PUBLIC';
  is_published?: boolean;
  constraints?: string;
}

export interface UpdateProblemRequest {
  name?: string;
  description?: string;
  difficulty_level?: 'easy' | 'med' | 'hard';
  visibility?: 'HIDDEN' | 'CONTEST_ONLY' | 'PUBLIC';
  is_published?: boolean;
  constraints?: string;
}

// ============== Test Case Types ==============
export interface TestCase {
  test_case_id: number;
  problem_id: number;
  input_data: string;
  expected_output: string;
  is_hidden: boolean;
}

export interface CreateTestCaseRequest {
  input_data: string;
  expected_output: string;
  is_hidden: boolean;
}

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

// ============== Submission Types ==============
export enum SubmissionStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  WrongAnswer = 'Wrong Answer',
  TimeLimitExceeded = 'Time Limit Exceeded',
  MemoryLimitExceeded = 'Memory Limit Exceeded',
  RuntimeError = 'Runtime Error',
  CompilationError = 'Compilation Error',
}

export interface CreateSubmissionRequest {
  problem_id: number;
  language_id: number;
  code_body: string;
}

export interface Submission {
  submission_id: string;
  user_id: string;
  problem_id: number;
  language_id: number;
  code_body: string;
  status: SubmissionStatus;
  runtime_ms?: number;
  memory_kb?: number;
  submitted_at: string;
}

export interface SubmissionResponse {
  success: boolean;
  message: string;
  data?: Submission;
  errors?: string[];
}

// ============== Language Types ==============
export interface Language {
  language_id: number;
  name: string;
  version: string;
}

// ============== API Response Types ==============
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[] | string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

// ============== Error Types ==============
export interface ApiError {
  statusCode: number;
  message: string;
  details?: string;
}

// ============== Express Declaration Merging ==============
declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: string;
        username: string;
        is_admin: boolean;
        role?: string;
      };
    }
  }
}

