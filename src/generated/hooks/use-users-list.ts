import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UsersListService } from "../services/users-list-service";
import type { UsersList } from "../models/users-list-model";
import type { IOperationOptions } from '../models/common-models';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all UsersList records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, ttulo, email, img, temp, user, usuario
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useUsersListList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["usersList-list", options],
    queryFn: () => UsersListService.getAll(options),
  });
}

/**
 * Retrieve a single UsersList record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useUsersList(id: string) {
  return useQuery({
    queryKey: ["usersList", id],
    queryFn: () => UsersListService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new UsersList record.
 */
export function useCreateUsersList() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<UsersList, "id">) => UsersListService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["usersList-list"] });
    },
  });
}

/**
 * Update an existing UsersList record.
 */
export function useUpdateUsersList() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<UsersList, "id">>;
    }) => UsersListService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["usersList-list"] });
      client.invalidateQueries({ queryKey: ["usersList", variables.id] });
    },
  });
}

/**
 * Delete a UsersList record by its unique identifier.
 */
export function useDeleteUsersList() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => UsersListService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["usersList-list"] });
      client.invalidateQueries({ queryKey: ["usersList", id] });
    },
  });
}