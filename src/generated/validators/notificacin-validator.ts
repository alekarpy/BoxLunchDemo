import { z } from 'zod';

/**
 * Zod schema for Notificacin validation
 */
export const NotificacinSchema = z.object({
  id: z.string().uuid(),
  notificacinnombre: z.string().min(1, { message: "Notificación Nombre is required" }),
  empleado: z.object({ id: z.string().uuid(), nombrecompleto: z.string() }).optional(),
  empleado1: z.object({ id: z.string().uuid(), nombrecompleto: z.string() }).optional(),
  fechahoraentrega: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "FechaHora Entrega is required" }),
  lugarentrega: z.string().min(1, { message: "Lugar Entrega is required" }),
  mensaje: z.string().min(1, { message: "Mensaje is required" }),
});

/**
 * Schema for creating a new Notificacin (omits system-generated ID)
 */
export const CreateNotificacinSchema = NotificacinSchema.omit({ id: true });

/**
 * Schema for updating an existing Notificacin
 */
export const UpdateNotificacinSchema = NotificacinSchema;

export type NotificacinInput = z.infer<typeof NotificacinSchema>;
export type CreateNotificacinInput = z.infer<typeof CreateNotificacinSchema>;
export type UpdateNotificacinInput = z.infer<typeof UpdateNotificacinSchema>;