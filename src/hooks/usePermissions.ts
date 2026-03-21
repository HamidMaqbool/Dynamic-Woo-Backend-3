
import { useCRMStore } from '../store/useStore';

export type AccessLevel = 'read' | 'write' | 'none';

export const usePermissions = () => {
    const { user } = useCRMStore();

    const hasPermission = (module: string, requiredAccess: AccessLevel = 'read'): boolean => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        
        const permission = user.permissions?.find(p => p.module === module);
        if (!permission) return false;

        if (requiredAccess === 'none') return true;
        if (requiredAccess === 'read') return permission.access === 'read' || permission.access === 'write';
        if (requiredAccess === 'write') return permission.access === 'write';

        return false;
    };

    const isAdmin = user?.role === 'admin';

    return { hasPermission, isAdmin, user };
};
