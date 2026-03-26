import React from 'react';
import { Product } from '../../store/useStore';
import { TextColumn } from './column-types/TextColumn';
import { SelectColumn } from './column-types/SelectColumn';
import { ImageColumn } from './column-types/ImageColumn';
import { BadgeColumn } from './column-types/BadgeColumn';
import { StatusColumn } from './column-types/StatusColumn';
import { RowActions } from './RowActions';
import { useTranslation } from 'react-i18next';

interface DataTableCellProps {
    col: any;
    item: any;
    localValue: any;
    statusOptions: { value: string; label: string }[];
    onLocalChange: (itemId: string, fieldName: string, value: any, autoUpdate?: boolean) => void;
    onManualUpdate: (itemId: string) => void;
    onDelete?: (itemId: string) => void;
    onEdit?: (itemId: string) => void;
    hasChanges: boolean;
}

export const DataTableCell: React.FC<DataTableCellProps> = ({
    col,
    item,
    localValue,
    statusOptions,
    onLocalChange,
    onManualUpdate,
    onDelete,
    onEdit,
    hasChanges
}) => {
    const { t } = useTranslation();
    const itemId = item.id;

    const fieldName = col.name as string;
    const originalValue = item[fieldName];
    const value = localValue !== undefined ? localValue : originalValue;
    
    const columnType = col.columnType || col.type;
    const isDisplayOnly = ['image', 'badge', 'action', 'manual_update'].includes(col.type);
    const effectiveType = columnType || (isDisplayOnly ? col.type : 'string');

    if (effectiveType === 'text') {
       
        return (
            <TextColumn 
                value={value as string}
                onChange={(val) => onLocalChange(itemId, fieldName, val, false)}
                onBlur={() => {
                    if (col.autoUpdate) {
                        onLocalChange(itemId, fieldName, value, true);
                    }
                }}
                placeholder={t('datatable.enterField', { field: col.name })}
            />
        );
    }

    if (effectiveType === 'select') {
        return (
            <SelectColumn 
                value={value as string}
                onChange={(val) => onLocalChange(itemId, fieldName, val, col.autoUpdate)}
                options={statusOptions}
            />
        );
    }

    if (col.type === 'image') {
        return <ImageColumn src={value as string} />;
    }

    if (col.type === 'action') {
        return (
            <RowActions 
                onEdit={() => onEdit(item.id)}
                onDelete={() => onDelete(item.id)}
                onUpdate={() => onManualUpdate(item.id)}
                hasChanges={hasChanges}
            />
        );
    }

    if (col.type === 'badge') {
        return <BadgeColumn value={value as string} type={value === 'variation' ? 'accent' : 'slate'} />;
    }

    if (col.col === 'status' && !col.columnType) {
        return <StatusColumn status={value as string} />;
    }

    return (
        <span className="text-sm text-slate-600 truncate block">
            {String(value || '-')}
        </span>
    );
};
