import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UsuariosDeAccesoService } from "../services/usuarios-de-acceso-service";
import type { UsuariosDeAcceso } from "../models/usuarios-de-acceso-model";
import type { IOperationOptions } from '../models/common-models';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all UsuariosDeAcceso records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, nombredeusuario, correoelectrnico, rolKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useUsuariosDeAccesoList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["usuariosDeAcceso-list", options],
    queryFn: () => UsuariosDeAccesoService.getAll(options),
  });
}

/**
 * Retrieve a single UsuariosDeAcceso record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useUsuariosDeAcceso(id: string) {
  return useQuery({
    queryKey: ["usuariosDeAcceso", id],
    queryFn: () => UsuariosDeAccesoService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new UsuariosDeAcceso record.
 */
export function useCreateUsuariosDeAcceso() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<UsuariosDeAcceso, "id">) => UsuariosDeAccesoService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["usuariosDeAcceso-list"] });
    },
  });
}

/**
 * Update an existing UsuariosDeAcceso record.
 */
export function useUpdateUsuariosDeAcceso() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<UsuariosDeAcceso, "id">>;
    }) => UsuariosDeAccesoService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["usuariosDeAcceso-list"] });
      client.invalidateQueries({ queryKey: ["usuariosDeAcceso", variables.id] });
    },
  });
}

/**
 * Delete a UsuariosDeAcceso record by its unique identifier.
 */
export function useDeleteUsuariosDeAcceso() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => UsuariosDeAccesoService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["usuariosDeAcceso-list"] });
      client.invalidateQueries({ queryKey: ["usuariosDeAcceso", id] });
    },
  });
}