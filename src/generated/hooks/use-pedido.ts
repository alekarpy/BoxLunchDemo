import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PedidoService } from "../services/pedido-service";
import type { Pedido } from "../models/pedido-model";
import type { IOperationOptions } from '../models/common-models';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all Pedido records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, pedidonombre, estatusKey, fechadecreacin, fechaentrega, horaentrega, cantidad, notas, motivocancelacinKey, motivocancelacintextolibre
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function usePedidoList(options?: IOperationOptions, refetchInterval?: number) {
  return useQuery({
    // Usamos siempre la misma key base para que la invalidación al crear/actualizar
    // afecte a TODAS las instancias del hook (tabla + index.tsx)
    queryKey: ["pedido-list"],
    queryFn: () => PedidoService.getAll(options),
    refetchInterval: refetchInterval,
    staleTime: 10_000, // 10 segundos: evita re-fetches en cascada al navegar
  });
}

/**
 * Retrieve a single Pedido record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function usePedido(id: string) {
  return useQuery({
    queryKey: ["pedido", id],
    queryFn: () => PedidoService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new Pedido record.
 */
export function useCreatePedido() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Pedido, "id">) => PedidoService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["pedido-list"] });
    },
  });
}

/**
 * Update an existing Pedido record.
 */
export function useUpdatePedido() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<Pedido, "id">>;
    }) => PedidoService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["pedido-list"] });
      client.invalidateQueries({ queryKey: ["pedido", variables.id] });
    },
  });
}

/**
 * Delete a Pedido record by its unique identifier.
 */
export function useDeletePedido() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => PedidoService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["pedido-list"] });
      client.invalidateQueries({ queryKey: ["pedido", id] });
    },
  });
}