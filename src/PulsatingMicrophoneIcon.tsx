import React from 'react';

interface PulsatingMicrophoneIconProps {
  isPulsating: boolean; // Control pulsation via prop
  onClick?: () => void; // Optional click handler
  size?: number; // Optional size for the icon
}

const PulsatingMicrophoneIcon: React.FC<PulsatingMicrophoneIconProps> = ({
  isPulsating,
  onClick,
  size = 24,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center justify-center rounded-full transition-colors 
                  ${isPulsating ? 'bg-primary/20 hover:bg-primary/30' : 'bg-gray-200 hover:bg-gray-300'}
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
      style={{ width: size * 2, height: size * 2 }}
      aria-label="Microphone"
    >
      {/* Pulsating animation circles */}
      {isPulsating && (
        <>
          <span
            className="animate-pulse-slow absolute inline-flex h-full w-full rounded-full bg-primary opacity-50"
            style={{ animationDuration: '2s' }}
          ></span>
          <span
            className="animate-pulse-slower absolute inline-flex h-3/4 w-3/4 rounded-full bg-primary opacity-30"
            style={{ animationDuration: '2.5s' }}
          ></span>
        </>
      )}
      {/* Microphone SVG Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`relative z-10 ${isPulsating ? 'text-primary' : 'text-gray-700'}`}
        width={size}
        height={size}
      >
        <path d="M11.9999 14.942C13.6326 14.942 14.942 13.6326 14.942 11.9999V6.00004C14.942 4.36739 13.6326 3.05802 11.9999 3.05802C10.3673 3.05802 9.05792 4.36739 9.05792 6.00004V11.9999C9.05792 13.6326 10.3673 14.942 11.9999 14.942Z" />
        <path d="M19.2352 12V12.002C19.2352 15.893 16.1292 19.002 12.2352 19.002C8.34116 19.002 5.23516 15.893 5.23516 12.002V12H7.17716V12.002C7.17716 14.799 9.43916 17.062 12.2352 17.062C15.0312 17.062 17.2932 14.799 17.2932 12.002V12H19.2352Z" />
        <path d="M12 21C12.5523 21 13 20.5523 13 20V19H11V20C11 20.5523 11.4477 21 12 21Z" />
      </svg>
    </button>
  );
};

export default PulsatingMicrophoneIcon;
