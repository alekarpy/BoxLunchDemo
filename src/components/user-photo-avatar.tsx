import { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useUsersListPhotos, preparePhotoUrl } from '@/hooks/use-users-list-photos';
import { MicrosoftEntraIDService } from '@/generated/services/microsoft-entra-id-service';

// Generic user type that can be MicrosoftEntraID or an adapted object
interface UserWithDisplayInfo {
  id?: string;
  unidentificadornicoparamicrosoftentraid?: string;
  nombreparamostrar?: string;
  nombredepila?: string;
  apellido?: string;
  correo?: string;
  nombreprincipaldeusuario?: string;
  // Optional reference to original user from Users_List for direct photo access
  _originalUser?: {
    img?: string;
    ttulo?: string;
    email?: string;
    user?: string;
  };
}

// Helper to extract user initials
function getUserInitials(user: UserWithDisplayInfo): string {
  const firstName = user.nombredepila || '';
  const lastName = user.apellido || '';
  
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  
  if (user.nombreparamostrar) {
    const parts = user.nombreparamostrar.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return user.nombreparamostrar.substring(0, 2).toUpperCase();
  }

  if (user.nombreprincipaldeusuario && user.nombreprincipaldeusuario.includes('@')) {
    const emailName = user.nombreprincipaldeusuario.split('@')[0];
    const parts = emailName.split(/[._-]/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return emailName.substring(0, 2).toUpperCase();
  }
  
  return 'U';
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

interface UserPhotoAvatarProps {
  /** Microsoft Entra ID user or adapted type with display fields */
  user: UserWithDisplayInfo;
  /** Employee photo URL (if available from Empleado table) */
  photoUrl?: string;
  /** Additional classes for the avatar */
  className?: string;
  /** Additional classes for the fallback */
  fallbackClassName?: string;
  /** Enable lazy loading */
  enableLazyLoad?: boolean;
}

/**
 * Avatar component that shows the user's photo or initials.
 * 
 * Photo priority:
 * 1. Users_List photo (if email matches the ttulo or email field)
 * 2. Provided photoUrl (synchronized profile photo field)
 * 3. Initials of the name as an elegant fallback
 */
export function UserPhotoAvatar({
  user,
  photoUrl,
  className,
  fallbackClassName,
  enableLazyLoad = true,
}: UserPhotoAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  // Search for photo in Users_List by email
  const { getPhotoByEmail } = useUsersListPhotos();
  
  // Determine the photo URL to use
  // Priority:
  // 1. Direct photo for demo accounts by email
  // 2. Direct photo from Microsoft Graph via Entra ID (if we have ID/unidentificadornicoparamicrosoftentraid)
  // 3. Direct photo from _originalUser (if coming from Users_List)
  // 4. Search by email in Users_List
  // 5. Provided photoUrl as fallback
  const effectivePhotoUrl = useMemo(() => {
    // Check for demo accounts directly by email
    const emailToSearch = user._originalUser?.ttulo || 
      user._originalUser?.email || 
      user.nombreprincipaldeusuario || 
      user.correo;
    const emailLower = emailToSearch?.toLowerCase().trim();
    if (emailLower === 'admin@demo.com') return 'https://randomuser.me/api/portraits/men/95.jpg';
    if (emailLower === 'operativo@demo.com') return 'https://randomuser.me/api/portraits/men/96.jpg';
    if (emailLower === 'desarrollador@demo.com') return 'https://randomuser.me/api/portraits/women/95.jpg';

    const resolvedEntraId = user.id || user.unidentificadornicoparamicrosoftentraid;
    if (resolvedEntraId) {
      const graphPhotoUrl = MicrosoftEntraIDService.getPhotoUrl(resolvedEntraId);
      if (graphPhotoUrl) {
        return graphPhotoUrl;
      }
    }

    // First: use direct photo from _originalUser if available
    if (user._originalUser?.img) {
      return preparePhotoUrl(user._originalUser.img);
    }
    
    // Second: attempt to get photo from Users_List by email
    // Prioritize ttulo/email of _originalUser if available
    const usersListPhoto = getPhotoByEmail(emailToSearch);
    if (usersListPhoto) {
      return preparePhotoUrl(usersListPhoto);
    }
    
    // Third: use URL provided as prop
    return photoUrl;
  }, [user.id, user.unidentificadornicoparamicrosoftentraid, user._originalUser, user.nombreprincipaldeusuario, user.correo, photoUrl, getPhotoByEmail]);
  
  const initials = getUserInitials(user);
  const avatarColor = getAvatarColor(user.nombreparamostrar || '');
  
  // Determine if we should show the image
  const showImage = effectivePhotoUrl && !imageError;
  
  return (
    <Avatar className={className}>
      {showImage && (
        <AvatarImage
          src={effectivePhotoUrl}
          alt={user.nombreparamostrar}
          loading={enableLazyLoad ? 'lazy' : 'eager'}
          onError={() => setImageError(true)}
        />
      )}
      <AvatarFallback
        className={cn(
          'text-xs font-medium text-white',
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
