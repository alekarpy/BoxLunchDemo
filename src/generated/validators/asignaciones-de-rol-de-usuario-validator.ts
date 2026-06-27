import { z } from 'zod';

/**
 * Zod schema for AsignacionesDeRolDeUsuario validation
 */
export const AsignacionesDeRolDeUsuarioSchema = z.object({
  id: z.string().uuid(),
  asignacionesderoldeusuarionombre: z.string().min(1, { message: "Asignaciones de rol de usuario Nombre is required" }),
  correoelectrnico: z.string().email().min(1, { message: "Correo electrónico is required" }),
  estadoactivo: z.boolean(),
  fechadeasignacin: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Fecha de asignación is required" }),
  historialdecambios: z.string().optional(),
  roldelsistema: z.object({ id: z.string().uuid(), nombrederol: z.string() }),
});

/**
 * Schema for creating a new AsignacionesDeRolDeUsuario (omits system-generated ID)
 */
export const CreateAsignacionesDeRolDeUsuarioSchema = AsignacionesDeRolDeUsuarioSchema.omit({ id: true });

/**
 * Schema for updating an existing AsignacionesDeRolDeUsuario
 */
export const UpdateAsignacionesDeRolDeUsuarioSchema = AsignacionesDeRolDeUsuarioSchema;

export type AsignacionesDeRolDeUsuarioInput = z.infer<typeof AsignacionesDeRolDeUsuarioSchema>;
export type CreateAsignacionesDeRolDeUsuarioInput = z.infer<typeof CreateAsignacionesDeRolDeUsuarioSchema>;
export type UpdateAsignacionesDeRolDeUsuarioInput = z.infer<typeof UpdateAsignacionesDeRolDeUsuarioSchema>;