import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmpleadoService } from "../services/empleado-service";
import type { Empleado } from "../models/empleado-model";
import type { IOperationOptions } from '../models/common-models';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all Empleado records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, nombrecompleto, entraobjectid, fotodeperfil, fotografa, userprincipalname
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useEmpleadoList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["empleado-list", options],
    queryFn: () => EmpleadoService.getAll(options),
  });
}

/**
 * Retrieve a single Empleado record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useEmpleado(id: string) {
  return useQuery({
    queryKey: ["empleado", id],
    queryFn: () => EmpleadoService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new Empleado record.
 */
export function useCreateEmpleado() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Empleado, "id">) => EmpleadoService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["empleado-list"] });
    },
  });
}

/**
 * Update an existing Empleado record.
 */
export function useUpdateEmpleado() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<Empleado, "id">>;
    }) => EmpleadoService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["empleado-list"] });
      client.invalidateQueries({ queryKey: ["empleado", variables.id] });
    },
  });
}

/**
 * Delete a Empleado record by its unique identifier.
 */
export function useDeleteEmpleado() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => EmpleadoService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["empleado-list"] });
      client.invalidateQueries({ queryKey: ["empleado", id] });
    },
  });
}