import { z } from 'zod';

export const zAccountProfile = z.object({
  id: z.string(),
  username: z.string().trim().min(3).max(64),
  email: z.string().trim().email(),
  avatarUrl: z.string().trim().url().optional(),
});

export const zUpdateAccountReq = z
  .object({
    email: z.string().trim().email().optional(),
    username: z.string().trim().min(3).max(64).optional(),
    avatarUrl: z.string().trim().url().optional(),
    password: z.string().min(6).max(256).optional(),
    currentPassword: z.string().min(6).max(256).optional(),
  })
  .refine(
    (value) =>
      Boolean(
        value.email ?? value.username ?? value.avatarUrl ?? value.password,
      ),
    { message: 'At least one field is required' },
  )
  .refine((value) => !value.password || Boolean(value.currentPassword), {
    message: 'Current password is required to change password',
  });

export type AccountProfileSchema = z.infer<typeof zAccountProfile>;
export type UpdateAccountReqSchema = z.infer<typeof zUpdateAccountReq>;
