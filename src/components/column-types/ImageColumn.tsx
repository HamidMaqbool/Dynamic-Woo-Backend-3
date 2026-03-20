
import React from 'react';

interface ImageColumnProps {
    src: string;
}

export const ImageColumn: React.FC<ImageColumnProps> = ({ src }) => {
    return (
        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            <img 
                src={src} 
                alt="Product" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
            />
        </div>
    );
};
