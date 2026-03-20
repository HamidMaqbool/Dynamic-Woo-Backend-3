
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from './Icon';
import { useCRMStore } from '../store/useStore';
import { cn } from '../utils/cn';

const TOAST_DURATION = 5000;

interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error';
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onRemove }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(TOAST_DURATION);

  useEffect(() => {
    if (!isPaused) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const newRemaining = remainingTimeRef.current - elapsed;
        
        if (newRemaining <= 0) {
          onRemove(id);
          clearInterval(timerRef.current!);
        } else {
          setProgress((newRemaining / TOAST_DURATION) * 100);
        }
      }, 10);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        const elapsed = Date.now() - startTimeRef.current;
        remainingTimeRef.current -= elapsed;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, id, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn(
        "relative group w-80 p-4 rounded-2xl shadow-2xl flex items-start gap-3 border overflow-hidden pointer-events-auto",
        type === 'success' ? "bg-emerald-500 text-white border-emerald-400" : "bg-rose-500 text-white border-rose-400"
      )}
    >
      <div className="shrink-0 mt-0.5">
        {type === 'success' ? (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-6 h-6 flex items-center justify-center bg-white/20 rounded-full"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                d="M20 6L9 17L4 12"
              />
            </svg>
          </motion.div>
        ) : (
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, -10, 10, 0],
            }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            <Icon name="alert-circle" className="w-6 h-6" />
          </motion.div>
        )}
      </div>
      
      <div className="flex-1">
        <p className="font-bold text-sm leading-tight uppercase tracking-wider">
          {type === 'success' ? 'Success' : 'Error'}
        </p>
        <p className="text-xs opacity-90 mt-1 font-medium">{message}</p>
      </div>

      <button onClick={() => onRemove(id)} className="shrink-0 hover:bg-white/20 p-1 rounded-lg transition-colors">
        <Icon name="x" className="w-4 h-4" />
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full">
        <motion.div 
          className="h-full bg-white/60"
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};

export const Notification: React.FC = () => {
  const { notifications, removeNotification } = useCRMStore();

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notif) => (
          <Toast 
            key={notif.id} 
            id={notif.id} 
            message={notif.message} 
            type={notif.type} 
            onRemove={removeNotification} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

