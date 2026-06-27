import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MicrosoftEntraIDService } from "../services/microsoft-entra-id-service";
import type { MicrosoftEntraID } from "../models/microsoft-entra-id-model";
import type { IOperationOptions } from '../models/common-models';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all MicrosoftEntraID records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, nombreparamostrar, apellido, cdigopostal, ciudad, correo, cuentademicrosoftentraidhabilitada, direccindelacalle, fechayhoradecreacin, idiomapreferido, imaddresses, nombredeempresa, nombredepila, nombreprincipaldeusuario, puesto, telfonomvil, telfonosdeltrabajo, tipodeusuario, ubicacindelaoficina, unidentificadornicoparamicrosoftentraid
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useMicrosoftEntraIDList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["microsoftEntraID-list", options],
    queryFn: () => MicrosoftEntraIDService.getAll(options),
  });
}

/**
 * Retrieve a single MicrosoftEntraID record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useMicrosoftEntraID(id: string) {
  return useQuery({
    queryKey: ["microsoftEntraID", id],
    queryFn: () => MicrosoftEntraIDService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new MicrosoftEntraID record.
 */
export function useCreateMicrosoftEntraID() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<MicrosoftEntraID, "id">) => MicrosoftEntraIDService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["microsoftEntraID-list"] });
    },
  });
}

/**
 * Update an existing MicrosoftEntraID record.
 */
export function useUpdateMicrosoftEntraID() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<MicrosoftEntraID, "id">>;
    }) => MicrosoftEntraIDService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["microsoftEntraID-list"] });
      client.invalidateQueries({ queryKey: ["microsoftEntraID", variables.id] });
    },
  });
}

/**
 * Delete a MicrosoftEntraID record by its unique identifier.
 */
export function useDeleteMicrosoftEntraID() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => MicrosoftEntraIDService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["microsoftEntraID-list"] });
      client.invalidateQueries({ queryKey: ["microsoftEntraID", id] });
    },
  });
}