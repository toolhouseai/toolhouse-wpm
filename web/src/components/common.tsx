/**
 * Reusable UI components
 */

import React from 'react';

/**
 * Timer display component
 */
export interface TimerProps {
  seconds: number;
  isActive: boolean;
}

export const Timer: React.FC<TimerProps> = ({ seconds, isActive }) => {
  const getColor = () => {
    if (seconds > 30) return 'text-green-600';
    if (seconds > 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="text-center">
      <p className={`text-6xl font-bold ${getColor()} font-mono`}>
        {String(seconds).padStart(2, '0')}
      </p>
      <p className="text-gray-600 mt-2">seconds remaining</p>
      {!isActive && <p className="text-sm text-gray-500 mt-1">Game paused</p>}
    </div>
  );
};

/**
 * Player stats card component
 */
export interface PlayerStatsProps {
  wpm: number;
  accuracy: number;
  charsTyped: number;
  label?: string;
  isCurrentPlayer?: boolean;
}

export const PlayerStats: React.FC<PlayerStatsProps> = ({
  wpm,
  accuracy,
  charsTyped,
  label,
  isCurrentPlayer,
}) => {
  return (
    <div className={`rounded-lg p-4 ${isCurrentPlayer ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50'}`}>
      {label && <p className="text-sm font-semibold text-gray-700 mb-3">{label}</p>}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-xs text-gray-600">WPM</p>
          <p className="text-2xl font-bold text-blue-600">{Math.round(wpm)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Accuracy</p>
          <p className="text-2xl font-bold text-green-600">{accuracy.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Chars</p>
          <p className="text-2xl font-bold text-purple-600">{charsTyped}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Progress bar component
 */
export interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
}) => {
  return (
    <div>
      {label && <p className="text-sm font-semibold text-gray-700 mb-2">{label}</p>}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-blue-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
      {showPercentage && (
        <p className="text-xs text-gray-600 mt-1">{Math.round(progress)}% complete</p>
      )}
    </div>
  );
};

/**
 * Loading spinner component
 */
export interface LoadingProps {
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      <p className="text-gray-600 mt-4">{message}</p>
    </div>
  );
};

/**
 * Error alert component
 */
export interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss }) => {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-red-800 font-semibold">Error</p>
          <p className="text-red-700">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 hover:text-red-800 font-bold text-xl"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Success alert component
 */
export interface SuccessAlertProps {
  message: string;
  onDismiss?: () => void;
}

export const SuccessAlert: React.FC<SuccessAlertProps> = ({ message, onDismiss }) => {
  return (
    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-green-800 font-semibold">Success</p>
          <p className="text-green-700">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-green-600 hover:text-green-800 font-bold text-xl"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Room ID display component
 */
export interface RoomIdDisplayProps {
  roomId: string;
  onCopy?: () => void;
}

export const RoomIdDisplay: React.FC<RoomIdDisplayProps> = ({ roomId, onCopy }) => {
  return (
    <div className="bg-gray-100 rounded-lg p-4 text-center mb-6">
      <p className="text-sm text-gray-600 mb-1">Room Code</p>
      <p className="text-4xl font-mono font-bold text-gray-900 mb-2">{roomId}</p>
      {onCopy && (
        <button
          onClick={onCopy}
          className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
        >
          Copy to clipboard
        </button>
      )}
    </div>
  );
};

/**
 * Button component variants
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  isLoading = false,
  children,
  disabled,
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
  };

  return (
    <button
      className={`
        px-6 py-3 font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
