import { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useUsersListPhotos, preparePhotoUrl } from '@/hooks/use-users-list-photos';
import { MicrosoftEntraIDService } from '@/generated/services/microsoft-entra-id-service';

// Helper to extract initials from name
function getUserInitials(name: string): string {
  if (!name) return 'U';
  
  // Do not use the employee ID (EMP-*) as initials, default to 'U'
  if (name.toUpperCase().startsWith('EMP-')) {
    return 'U';
  }
  
  if (name.includes('@')) {
    const parts = name.split('@')[0].split(/[._-]/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// Helper to generate avatar color based on name
function getAvatarColor(name: string): string {
  const colors = [
    'bg-rose-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

interface EmployeePhotoAvatarProps {
  /** Employee profile photo URL (profile photo field synchronized from Entra ID) */
  photoUrl?: string;
  /** Employee name (for initials fallback) */
  employeeName: string;
  /** Employee email to search for photo in Users_List */
  employeeEmail?: string;
  /** Microsoft Entra object ID to get direct photo from backend */
  entraObjectId?: string;
  /** Additional classes for the avatar */
  className?: string;
  /** Additional classes for the fallback */
  fallbackClassName?: string;
  /** Enable lazy loading */
  enableLazyLoad?: boolean;
}

/**
 * Avatar component that shows the employee's profile photo.
 * 
 * Photo priority:
 * 1. Users_List photo (if employee email matches)
 * 2. Provided photoUrl (profile photo field synchronized from Entra ID)
 * 3. Initials of the name as fallback
 * 
 * @param photoUrl - URL of the employee's profile photo
 * @param employeeName - Employee name to show initials as fallback
 * @param employeeEmail - Employee email to search for photo in Users_List
 */
export function EmployeePhotoAvatar({
  photoUrl,
  employeeName,
  employeeEmail,
  entraObjectId,
  className,
  fallbackClassName,
  enableLazyLoad = true,
}: EmployeePhotoAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  // Search for photo in Users_List by email
  const { getPhotoByEmail, getUserByEmail } = useUsersListPhotos();
  
  // Determine the photo URL to use (priority: Demo accounts > Users_List.Img > Microsoft Graph > photoUrl)
  const effectivePhotoUrl = useMemo(() => {
    // Check for demo accounts directly by email
    const emailLower = employeeEmail?.toLowerCase().trim();
    if (emailLower === 'admin@demo.com') return 'https://randomuser.me/api/portraits/men/95.jpg';
    if (emailLower === 'operativo@demo.com') return 'https://randomuser.me/api/portraits/men/96.jpg';
    if (emailLower === 'desarrollador@demo.com') return 'https://randomuser.me/api/portraits/women/95.jpg';

    // 0. If we don't have an ID but have an email, search for the ID in Entra cache
    const resolvedEntraId = entraObjectId || getUserByEmail(employeeEmail)?.id;

    // 1. Attempt to get the photo from Users_List by email (legacy cache)
    const usersListPhoto = getPhotoByEmail(employeeEmail);
    if (usersListPhoto) {
      return preparePhotoUrl(usersListPhoto);
    }

    // 2. Attempt to get the photo from the new Microsoft Graph endpoint in the backend
    if (resolvedEntraId) {
      const graphPhotoUrl = MicrosoftEntraIDService.getPhotoUrl(resolvedEntraId);
      if (graphPhotoUrl) {
        return graphPhotoUrl;
      }
    }

    // 3. If there is no photo, use the provided one as fallback
    return photoUrl;
  }, [employeeEmail, entraObjectId, photoUrl, getPhotoByEmail, getUserByEmail]);
  
  const initials = getUserInitials(employeeName);
  const avatarColor = getAvatarColor(employeeName);
  
  // Determine if we should show the image
  const showImage = effectivePhotoUrl && !imageError;
  
  return (
    <Avatar className={className}>
      {showImage && (
        <AvatarImage
          src={effectivePhotoUrl}
          alt={employeeName}
          loading={enableLazyLoad ? 'lazy' : 'eager'}
          onError={() => setImageError(true)}
        />
      )}
      <AvatarFallback
        className={cn(
          'text-xs font-semibold text-white',
          avatarColor,
          fallbackClassName
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export { getUserInitials, getAvatarColor };
