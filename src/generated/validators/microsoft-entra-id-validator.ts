import { z } from 'zod';

/**
 * Zod schema for MicrosoftEntraID validation
 */
export const MicrosoftEntraIDSchema = z.object({
  id: z.string().uuid(),
  nombreparamostrar: z.string(),
  apellido: z.string().optional(),
  cdigopostal: z.string().optional(),
  ciudad: z.string().optional(),
  correo: z.string().optional(),
  cuentademicrosoftentraidhabilitada: z.boolean().optional(),
  direccindelacalle: z.string().optional(),
  fechayhoradecreacin: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  idiomapreferido: z.string().optional(),
  imaddresses: z.string().optional(),
  nombredeempresa: z.string().optional(),
  nombredepila: z.string().optional(),
  nombreprincipaldeusuario: z.string().optional(),
  puesto: z.string().optional(),
  telfonomvil: z.string().optional(),
  telfonosdeltrabajo: z.string().optional(),
  tipodeusuario: z.string().optional(),
  ubicacindelaoficina: z.string().optional(),
  unidentificadornicoparamicrosoftentraid: z.string().uuid().min(1, { message: "Un identificador único para Microsoft Entra ID is required" }),
});

/**
 * Schema for creating a new MicrosoftEntraID (omits system-generated ID)
 */
export const CreateMicrosoftEntraIDSchema = MicrosoftEntraIDSchema.omit({ id: true });

/**
 * Schema for updating an existing MicrosoftEntraID
 */
export const UpdateMicrosoftEntraIDSchema = MicrosoftEntraIDSchema;

export type MicrosoftEntraIDInput = z.infer<typeof MicrosoftEntraIDSchema>;
export type CreateMicrosoftEntraIDInput = z.infer<typeof CreateMicrosoftEntraIDSchema>;
export type UpdateMicrosoftEntraIDInput = z.infer<typeof UpdateMicrosoftEntraIDSchema>;