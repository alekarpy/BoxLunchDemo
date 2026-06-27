import { z } from 'zod';

/**
 * Zod schema for Empleado validation
 */
export const EmpleadoSchema = z.object({
  id: z.string().uuid(),
  nombrecompleto: z.string().min(1, { message: "Nombre Completo is required" }),
  entraobjectid: z.string().min(1, { message: "Entra Object ID is required" }),
  fotodeperfil: z.string().url().optional(),
  fotografa: z.string().url().optional(),
  userprincipalname: z.string().optional(),
});

/**
 * Schema for creating a new Empleado (omits system-generated ID)
 */
export const CreateEmpleadoSchema = EmpleadoSchema.omit({ id: true });

/**
 * Schema for updating an existing Empleado
 */
export const UpdateEmpleadoSchema = EmpleadoSchema;

export type EmpleadoInput = z.infer<typeof EmpleadoSchema>;
export type CreateEmpleadoInput = z.infer<typeof CreateEmpleadoSchema>;
export type UpdateEmpleadoInput = z.infer<typeof UpdateEmpleadoSchema>;