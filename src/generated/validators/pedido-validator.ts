import { z } from 'zod';

/**
 * Zod schema for Pedido validation
 */
export const PedidoSchema = z.object({
  id: z.string().uuid(),
  pedidonombre: z.string().min(1, { message: "Pedido Nombre is required" }),
  empleado: z.object({ id: z.string().uuid(), nombrecompleto: z.string() }).optional(),
  empleado1: z.object({ id: z.string().uuid(), nombrecompleto: z.string() }).optional(),
  estatusKey: z.enum(['EstatusKey0', 'EstatusKey1', 'EstatusKey2']),
  fechadecreacin: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  fechaentrega: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "Fecha Entrega is required" }),
  horaentrega: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Hora Entrega is required" }),
  cantidad: z.number().min(1, { message: "Cantidad debe ser al menos 1" }),
  notas: z.string().min(1, { message: "Notas is required" }),
  motivocancelacinKey: z.enum(['MotivocancelacinKey0', 'MotivocancelacinKey1', 'MotivocancelacinKey2', 'MotivocancelacinKey3', 'MotivocancelacinKey4', 'MotivocancelacinKey5']).optional(),
  motivocancelacintextolibre: z.string().optional(),
});

/**
 * Schema for creating a new Pedido (omits system-generated ID)
 */
export const CreatePedidoSchema = PedidoSchema.omit({ id: true });

/**
 * Schema for updating an existing Pedido
 */
export const UpdatePedidoSchema = PedidoSchema;

export type PedidoInput = z.infer<typeof PedidoSchema>;
export type CreatePedidoInput = z.infer<typeof CreatePedidoSchema>;
export type UpdatePedidoInput = z.infer<typeof UpdatePedidoSchema>;