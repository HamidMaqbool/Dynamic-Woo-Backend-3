
import React from 'react';
import { MediaManager } from '../components/media/MediaManager';

const MediaPage: React.FC = () => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <MediaManager />
    </div>
  );
};

export default MediaPage;
