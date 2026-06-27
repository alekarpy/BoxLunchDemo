import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificacinService } from "../services/notificacin-service";
import type { Notificacin } from "../models/notificacin-model";
import type { IOperationOptions } from '../models/common-models';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all Notificacin records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, notificacinnombre, fechahoraentrega, lugarentrega, mensaje
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useNotificacinList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["notificacin-list", options],
    queryFn: () => NotificacinService.getAll(options),
  });
}

/**
 * Retrieve a single Notificacin record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useNotificacin(id: string) {
  return useQuery({
    queryKey: ["notificacin", id],
    queryFn: () => NotificacinService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new Notificacin record.
 */
export function useCreateNotificacin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Notificacin, "id">) => NotificacinService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["notificacin-list"] });
    },
  });
}

/**
 * Update an existing Notificacin record.
 */
export function useUpdateNotificacin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<Notificacin, "id">>;
    }) => NotificacinService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["notificacin-list"] });
      client.invalidateQueries({ queryKey: ["notificacin", variables.id] });
    },
  });
}

/**
 * Delete a Notificacin record by its unique identifier.
 */
export function useDeleteNotificacin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => NotificacinService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["notificacin-list"] });
      client.invalidateQueries({ queryKey: ["notificacin", id] });
    },
  });
}