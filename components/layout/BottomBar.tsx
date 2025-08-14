
import React from 'react';
import LexConsole from '../voice/LexConsole';

const BottomBar: React.FC = () => {
  return (
    <footer className="bottom-bar h-32 bg-gray-900/50 backdrop-blur-sm border-t border-border-color flex items-center justify-center p-4 z-10">
      <LexConsole />
    </footer>
  );
};

export default BottomBar;
