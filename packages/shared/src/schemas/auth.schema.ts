import { z } from 'zod';

export const zAuthUser = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string().min(3).max(64),
  avatarUrl: z.string().url().optional(),
});

export const zLoginReq = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(256),
});

export const zLoginRes = z.object({
  token: z.string(),
  user: zAuthUser,
});

export const zRegisterReq = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(256),
  username: z.string().min(3).max(64).optional(),
});

export const zRegisterRes = zLoginRes;

export type AuthUserSchema = z.infer<typeof zAuthUser>;
export type LoginReqSchema = z.infer<typeof zLoginReq>;
export type LoginResSchema = z.infer<typeof zLoginRes>;
export type RegisterReqSchema = z.infer<typeof zRegisterReq>;
export type RegisterResSchema = z.infer<typeof zRegisterRes>;
