
import React from 'react';
import { Icon } from '../../Icon';

interface ActionColumnProps {
    onEdit: () => void;
    onDelete: () => void;
}

export const ActionColumn: React.FC<ActionColumnProps> = ({ onEdit, onDelete }) => {
    return (
        <div className="flex items-center gap-2">
            <button 
                onClick={onEdit}
                className="p-2 rounded-md hover:bg-accent/10 text-slate-400 hover:text-accent transition-colors"
                title="Edit"
            >
                <Icon name="edit" className="w-4 h-4" />
            </button>
            <button 
                onClick={onDelete}
                className="p-2 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                title="Delete"
            >
                <Icon name="trash-2" className="w-4 h-4" />
            </button>
        </div>
    );
};
