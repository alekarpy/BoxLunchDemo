import { z } from 'zod';

/**
 * Zod schema for RolesDelSistema validation
 */
export const RolesDelSistemaSchema = z.object({
  id: z.string().uuid(),
  nombrederol: z.string().min(1, { message: "Nombre de Rol is required" }),
  descripcin: z.string().optional(),
});

/**
 * Schema for creating a new RolesDelSistema (omits system-generated ID)
 */
export const CreateRolesDelSistemaSchema = RolesDelSistemaSchema.omit({ id: true });

/**
 * Schema for updating an existing RolesDelSistema
 */
export const UpdateRolesDelSistemaSchema = RolesDelSistemaSchema;

export type RolesDelSistemaInput = z.infer<typeof RolesDelSistemaSchema>;
export type CreateRolesDelSistemaInput = z.infer<typeof CreateRolesDelSistemaSchema>;
export type UpdateRolesDelSistemaInput = z.infer<typeof UpdateRolesDelSistemaSchema>;