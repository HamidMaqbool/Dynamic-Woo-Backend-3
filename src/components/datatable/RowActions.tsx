
import React from 'react';
import { Icon } from '../Icon';
import { useTranslation } from 'react-i18next';

interface RowActionsProps {
    onEdit?: () => void;
    onDelete?: () => void;
    onUpdate?: () => void;
    hasChanges?: boolean;
 
}

export const RowActions: React.FC<RowActionsProps> = ({ 
    onEdit, 
    onDelete, 
    onUpdate, 
    hasChanges
}) => {
    const { t } = useTranslation();
    return (
        <div className="flex items-center gap-2">
            {onUpdate && (hasChanges ) && (
                <button 
                    onClick={onUpdate}
                    className="p-2 rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                    title={ t('common.saveChanges')}
                >
                    <Icon name="save" className="w-4 h-4" />
                </button>
            )}
            { onEdit && (
                <button 
                    onClick={onEdit}
                    className="p-2 rounded-md hover:bg-accent/10 text-slate-400 hover:text-accent transition-colors"
                    title={t('common.edit')}
                >
                    <Icon name="edit" className="w-4 h-4" />
                </button>
            )}
            {onDelete && (
                <button 
                    onClick={onDelete}
                    className="p-2 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                    title={ t('common.delete')}
                >
                    <Icon name={ "trash-2"} className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};
