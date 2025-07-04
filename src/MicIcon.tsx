import React from 'react';

const MicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    // Defaults are fine, props will override if needed
    // fill="currentColor" 
    // stroke="currentColor"
    strokeWidth="1.5"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15c-2.485 0-4.5-2.015-4.5-4.5V6c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5v4.5c0 2.485-2.015 4.5-4.5 4.5z" />
  </svg>
);

export default MicIcon;
