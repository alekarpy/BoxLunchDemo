import { z } from 'zod';

/**
 * Zod schema for UsersList validation
 */
export const UsersListSchema = z.object({
  id: z.string().uuid(),
  ttulo: z.string(),
  email: z.string().email().optional(),
  img: z.string().url().optional(),
  temp: z.string().optional(),
  user: z.string().optional(),
  usuario: z.string().optional(),
});

/**
 * Schema for creating a new UsersList (omits system-generated ID)
 */
export const CreateUsersListSchema = UsersListSchema.omit({ id: true });

/**
 * Schema for updating an existing UsersList
 */
export const UpdateUsersListSchema = UsersListSchema;

export type UsersListInput = z.infer<typeof UsersListSchema>;
export type CreateUsersListInput = z.infer<typeof CreateUsersListSchema>;
export type UpdateUsersListInput = z.infer<typeof UpdateUsersListSchema>;