import React from 'react';
import { FOOTER_TEXT } from '../constants';

interface FooterProps {
  appConfig?: any;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onOpenAbout?: () => void;
  onOpenSafety?: () => void;
  onOpenContact?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  appConfig, 
  onOpenPrivacy, 
  onOpenTerms, 
  onOpenAbout,
  onOpenSafety,
  onOpenContact
}) => {
  return (
    <footer className="border-t border-white/5 bg-neutral-900 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
            <button onClick={onOpenAbout} className="hover:text-orange-500 transition-colors cursor-pointer">About Us</button>
            <span className="h-1 w-1 rounded-full bg-neutral-800"></span>
            <button onClick={onOpenPrivacy} className="hover:text-orange-500 transition-colors cursor-pointer">Privacy Policy</button>
            <span className="h-1 w-1 rounded-full bg-neutral-800"></span>
            <button onClick={onOpenTerms} className="hover:text-orange-500 transition-colors cursor-pointer">Terms & Conditions</button>
            <span className="h-1 w-1 rounded-full bg-neutral-800"></span>
            <button onClick={onOpenSafety} className="hover:text-orange-500 transition-colors cursor-pointer">Safety Standards</button>
            <span className="h-1 w-1 rounded-full bg-neutral-800"></span>
            <button onClick={onOpenContact} className="hover:text-orange-500 transition-colors cursor-pointer">Contact Us</button>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-center border-t border-white/5 pt-8">
          <div className="flex items-center gap-4 text-sm font-bold text-orange-500">
            <span>{FOOTER_TEXT}</span>
            <span className="h-4 w-px bg-white/5"></span>
            <a href="https://ai.studio" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-orange-400 transition-colors">
              Powered by <span className="text-orange-500">Google AI Studio</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
