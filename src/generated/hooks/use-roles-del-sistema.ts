import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RolesDelSistemaService } from "../services/roles-del-sistema-service";
import type { RolesDelSistema } from "../models/roles-del-sistema-model";
import type { IOperationOptions } from '../models/common-models';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RolesDelSistema records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, nombrederol, descripcin
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRolesDelSistemaList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["rolesDelSistema-list", options],
    queryFn: () => RolesDelSistemaService.getAll(options),
  });
}

/**
 * Retrieve a single RolesDelSistema record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRolesDelSistema(id: string) {
  return useQuery({
    queryKey: ["rolesDelSistema", id],
    queryFn: () => RolesDelSistemaService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RolesDelSistema record.
 */
export function useCreateRolesDelSistema() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RolesDelSistema, "id">) => RolesDelSistemaService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["rolesDelSistema-list"] });
    },
  });
}

/**
 * Update an existing RolesDelSistema record.
 */
export function useUpdateRolesDelSistema() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RolesDelSistema, "id">>;
    }) => RolesDelSistemaService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["rolesDelSistema-list"] });
      client.invalidateQueries({ queryKey: ["rolesDelSistema", variables.id] });
    },
  });
}

/**
 * Delete a RolesDelSistema record by its unique identifier.
 */
export function useDeleteRolesDelSistema() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RolesDelSistemaService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["rolesDelSistema-list"] });
      client.invalidateQueries({ queryKey: ["rolesDelSistema", id] });
    },
  });
}