import { z } from 'zod';

/**
 * Zod schema for UsuariosDeAcceso validation
 */
export const UsuariosDeAccesoSchema = z.object({
  id: z.string().uuid(),
  nombredeusuario: z.string().min(1, { message: "Nombre de usuario is required" }),
  correoelectrnico: z.string().min(1, { message: "Correo electrónico is required" }),
  rolKey: z.enum(['RolKey0', 'RolKey1', 'RolKey2']),
});

/**
 * Schema for creating a new UsuariosDeAcceso (omits system-generated ID)
 */
export const CreateUsuariosDeAccesoSchema = UsuariosDeAccesoSchema.omit({ id: true });

/**
 * Schema for updating an existing UsuariosDeAcceso
 */
export const UpdateUsuariosDeAccesoSchema = UsuariosDeAccesoSchema;

export type UsuariosDeAccesoInput = z.infer<typeof UsuariosDeAccesoSchema>;
export type CreateUsuariosDeAccesoInput = z.infer<typeof CreateUsuariosDeAccesoSchema>;
export type UpdateUsuariosDeAccesoInput = z.infer<typeof UpdateUsuariosDeAccesoSchema>;