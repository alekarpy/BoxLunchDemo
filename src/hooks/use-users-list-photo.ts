/**
 * Hook to retrieve the photo of an individual user.
 * 
 * The user source is Microsoft Entra ID (read-only).
 * Photos are resolved from cr00d_users_list1 (Users_List) by email match.
 * 
 * @param emailOrName - User email to search for
 * @param fallbackName - Optional fallback name (not currently used)
 * @returns Object with the photo URL and loading state
 */
import { useMemo } from 'react';
import { useEntraUsers } from './use-entra-users';
import { preparePhotoUrl } from './use-users-list-photos';

interface UseUsersListPhotoResult {
  /** Prepared photo URL (with data:image/ prefix if necessary) */
  data: string | undefined;
  /** Indicates if the data is loading */
  isLoading: boolean;
}

/**
 * Hook that retrieves a user's photo.
 * 
 * Data source:
 * - Users: Microsoft Entra ID (single authoritative source)
 * - Photos: cr00d_users_list1 (Users_List) by matching email with Entra ID
 * 
 * Users that only exist in Users_List will not have a visible photo.
 * 
 * @example
 * const { data: photoUrl } = useUsersListPhoto('user@company.com');
 */
export function useUsersListPhoto(
  emailOrName: string | undefined | null,
  _fallbackName?: string | undefined | null
): UseUsersListPhotoResult {
  const { getPhotoByEmail, isLoading } = useEntraUsers();
  
  const photoUrl = useMemo(() => {
    if (!emailOrName) return undefined;
    
    // Search photo by email
    const rawPhoto = getPhotoByEmail(emailOrName);
    if (rawPhoto) return preparePhotoUrl(rawPhoto);
    
    return undefined;
  }, [emailOrName, getPhotoByEmail]);
  
  return {
    data: photoUrl,
    isLoading,
  };
}