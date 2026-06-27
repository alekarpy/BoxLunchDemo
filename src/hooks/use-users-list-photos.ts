/**
 * Hook to get user photos.
 * 
 * DATA SOURCE:
 * - Users: Microsoft Login ID (single and authoritative source)
  * - Photos: cr00d_users_list1 (Users_List) by email match with Entra ID
 * 
 * Users that only exist in Users_List DO NOT appear.
 * The 'title' field of Users_List contains the user's email.
 * The 'img' field contains the direct URL of the user's photo.
 */
import { useMemo, useCallback } from 'react';
import { useEntraUsers, type EntraUsersLoadProgress } from './use-entra-users';
import type { MicrosoftEntraID } from '../generated/models/microsoft-entra-id-model';

// Re-export types for compatibility
export type { EntraUsersLoadProgress as UsersListLoadProgress };

// Type adapted to maintain compatibility with existing components
export interface UsersList {
  id: string;
  ttulo: string;
  email?: string;
  img?: string;
  temp?: string;
  user?: string;
  usuario?: string;
  // Campos adicionales mapeados desde Entra ID
  nombreparamostrar?: string;
  nombreprincipaldeusuario?: string;
  correo?: string;
}

interface UseUsersListPhotosResult {
  /** Indicates if data is loading */
  isLoading: boolean;
  /** Indicates if the upload is complete */
  isComplete: boolean;
  /** Total number of records uploaded */
  totalRecords: number;
  /** Map emails to photo URLs */
  photosByEmail: Map<string, string>;
  /** Function to obtain a user's photo by email */
  getPhotoByEmail: (email: string | undefined | null) => string | undefined;
  /** Function to get the complete user by email */
  getUserByEmail: (email: string | undefined | null) => UsersList | undefined;
  /** User list adapted from Microsoft Entra ID */
  usersList: UsersList[];
  /** Loading progress with details */
  progress: EntraUsersLoadProgress;
  /** Function to clear cache and reload */
  clearCacheAndReload: () => Promise<void>;
}

/**
 * Converts a Microsoft User Login ID to UsersList format for compatibility.
 */
function adaptEntraUserToUsersList(user: MicrosoftEntraID, photoUrl?: string): UsersList {
  const email = user.nombreprincipaldeusuario || user.correo || '';
  const displayName = user.nombreparamostrar || `${user.nombredepila || ''} ${user.apellido || ''}`.trim() || email;
  
  return {
    id: user.id,
    ttulo: email,
    email: email,
    img: photoUrl,
    user: displayName,
    usuario: displayName,
    nombreparamostrar: user.nombreparamostrar,
    nombreprincipaldeusuario: user.nombreprincipaldeusuario,
    correo: user.correo,
  };
}

/**
 * Normalize email for comparison.
 */
function normalizeEmail(email: string | undefined | null): string {
  if (!email) return '';
  return email.toLowerCase().trim();
}

/**
 * Hook that gets users from Microsoft Login ID with photos from Users_List.
 * 
 * Maintains compatibility with the previous API but uses Microsoft Entra ID as source.
 * Users that only exist in cr00d_users_list1 DO NOT appear.
 * 
 * @example
 * const { getPhotoByEmail, usersList, isLoading } = useUsersListPhotos();
 * const photoUrl = getPhotoByEmail(employee?.userprincipalname);
 */
export function useUsersListPhotos(): UseUsersListPhotosResult {
  const { 
    entraUsers, 
    photoMap, 
    isLoading, 
    progress, 
    clearCacheAndReload,
    getPhotoByEmail: getPhotoByEmailEntra,
    getUserByEmail: getUserByEmailEntra,
  } = useEntraUsers();
  
  const isComplete = !isLoading && entraUsers.length > 0;

  // Adapt Entra ID users to UsersList format
  const usersList = useMemo(() => {
    return entraUsers.map((user: MicrosoftEntraID) => {
      const email = normalizeEmail(user.nombreprincipaldeusuario || user.correo);
      const photoUrl = photoMap[email];
      return adaptEntraUserToUsersList(user, photoUrl);
    });
  }, [entraUsers, photoMap]);

  // Create photo map by email
  const photosByEmail = useMemo(() => {
    const map = new Map<string, string>();
    for (const [email, url] of Object.entries(photoMap)) {
      if (email && url) {
        map.set(email, (url as unknown) as string);
      }
    }
    return map;
  }, [photoMap]);

  // Function to obtain photo by email
  const getPhotoByEmail = useCallback((email: string | undefined | null): string | undefined => {
    return getPhotoByEmailEntra(email);
  }, [getPhotoByEmailEntra]);

  // Function to obtain adapted user by email
  const getUserByEmail = useCallback((email: string | undefined | null): UsersList | undefined => {
    const entraUser = getUserByEmailEntra(email);
    if (!entraUser) return undefined;
    
    const normalized = normalizeEmail(email);
    const photoUrl = photoMap[normalized];
    return adaptEntraUserToUsersList(entraUser, photoUrl);
  }, [getUserByEmailEntra, photoMap]);

  return {
    isLoading,
    isComplete,
    totalRecords: entraUsers.length,
    photosByEmail,
    getPhotoByEmail,
    getUserByEmail,
    usersList,
    progress,
    clearCacheAndReload,
  };
}

/**
 * Prepare the image URL to display.
 * If it is a direct URL (http/https), it returns it as is.
 * If it is a data:image, returns it as is.
 * If it is just base64 (legacy) content, add the appropriate prefix.
 */
export function preparePhotoUrl(photo: string | undefined | null): string | undefined {
  if (!photo) return undefined;
  
  const trimmedPhoto = photo.trim();
  if (!trimmedPhoto) return undefined;
  
  // If it is a normal URL (http/https), use it directly
  if (trimmedPhoto.startsWith('http://') || trimmedPhoto.startsWith('https://')) {
    return trimmedPhoto;
  }
  
  // If you already have the data:image prefix, use it directly
  if (trimmedPhoto.startsWith('data:image/')) {
    return trimmedPhoto;
  }
  
  // If it's just the base64 (legacy) content, try to detect the type
  let mimeType = 'image/png'; // Default PNG
  
  if (trimmedPhoto.startsWith('/9j/')) {
    mimeType = 'image/jpeg';
  } else if (trimmedPhoto.startsWith('iVBOR')) {
    mimeType = 'image/png';
  } else if (trimmedPhoto.startsWith('R0lGOD')) {
    mimeType = 'image/gif';
  } else if (trimmedPhoto.startsWith('UklGR')) {
    mimeType = 'image/webp';
  }
  
  return `data:${mimeType};base64,${trimmedPhoto}`;
}

/**
 * @deprecated Use preparePhotoUrl instead
 */
export const prepareBase64PhotoUrl = preparePhotoUrl;
