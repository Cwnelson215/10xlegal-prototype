import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
  role: z.enum(['client', 'lawyer', 'legal-official', 'admin']),
});

export const registerSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['client', 'lawyer', 'legal-official']),
  lawyerInfo: z.object({
    stateBarAssociation: z.string(),
    barNumber: z.string(),
  }).optional(),
  legalOfficialInfo: z.object({
    governmentAgency: z.string(),
    officialId: z.string(),
  }).optional(),
});

export const createCaseSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  caseNumber: z.string().min(1, 'Case number required'),
  clientId: z.string().min(1, 'Client ID required'),
  lawyerId: z.string().optional(),
});

export const updateCaseSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'active', 'on-hold', 'closed']).optional(),
  lawyerId: z.string().optional(),
});

export const createDeadlineSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  dueDate: z.string().min(1, 'Due date required'),
  caseId: z.string().min(1, 'Case ID required'),
  assignedTo: z.string().optional(),
});

export const updateDeadlineSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['pending', 'completed', 'overdue']).optional(),
  assignedTo: z.string().optional(),
});

export const createJudgeSchema = z.object({
  name: z.string().min(1, 'Name required'),
  title: z.string().optional(),
  court: z.string().optional(),
  district: z.string().optional(),
});

export const assignJudgeSchema = z.object({
  judgeId: z.string().min(1, 'Judge ID required'),
});
