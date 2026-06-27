import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AsignacionesDeRolDeUsuarioService } from "../services/asignaciones-de-rol-de-usuario-service";
import type { AsignacionesDeRolDeUsuario } from "../models/asignaciones-de-rol-de-usuario-model";
import type { IOperationOptions } from '../models/common-models';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all AsignacionesDeRolDeUsuario records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, asignacionesderoldeusuarionombre, correoelectrnico, estadoactivo, fechadeasignacin, historialdecambios
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useAsignacionesDeRolDeUsuarioList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["asignacionesDeRolDeUsuario-list", options],
    queryFn: () => AsignacionesDeRolDeUsuarioService.getAll(options),
  });
}

/**
 * Retrieve a single AsignacionesDeRolDeUsuario record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useAsignacionesDeRolDeUsuario(id: string) {
  return useQuery({
    queryKey: ["asignacionesDeRolDeUsuario", id],
    queryFn: () => AsignacionesDeRolDeUsuarioService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new AsignacionesDeRolDeUsuario record.
 */
export function useCreateAsignacionesDeRolDeUsuario() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<AsignacionesDeRolDeUsuario, "id">) => AsignacionesDeRolDeUsuarioService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["asignacionesDeRolDeUsuario-list"] });
    },
  });
}

/**
 * Update an existing AsignacionesDeRolDeUsuario record.
 */
export function useUpdateAsignacionesDeRolDeUsuario() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<AsignacionesDeRolDeUsuario, "id">>;
    }) => AsignacionesDeRolDeUsuarioService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["asignacionesDeRolDeUsuario-list"] });
      client.invalidateQueries({ queryKey: ["asignacionesDeRolDeUsuario", variables.id] });
    },
  });
}

/**
 * Delete a AsignacionesDeRolDeUsuario record by its unique identifier.
 */
export function useDeleteAsignacionesDeRolDeUsuario() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AsignacionesDeRolDeUsuarioService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["asignacionesDeRolDeUsuario-list"] });
      client.invalidateQueries({ queryKey: ["asignacionesDeRolDeUsuario", id] });
    },
  });
}