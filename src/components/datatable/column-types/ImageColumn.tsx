
import React from 'react';

interface ImageColumnProps {
    src: string;
}

export const ImageColumn: React.FC<ImageColumnProps> = ({ src }) => {
    return (
        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0">
            <img 
                src={src || 'https://picsum.photos/seed/placeholder/100/100'} 
                alt="Product" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
            />
        </div>
    );
};
