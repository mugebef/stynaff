import React from 'react';
import { Globe, Heart, Shield, Zap } from 'lucide-react';
import { APP_NAME, FOOTER_TEXT } from '../constants';

interface FooterProps {
  appConfig?: any;
}

export const Footer: React.FC<FooterProps> = ({ appConfig }) => {
  return (
    <footer className="border-t border-white/5 bg-neutral-900 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 p-2 shadow-lg ring-1 ring-white/10">
              {appConfig?.logoUrl ? (
                <img src={appConfig.logoUrl} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <Globe size={24} className="text-orange-500" />
              )}
            </div>
            <span className="font-display text-2xl font-black tracking-tighter text-white uppercase italic">
              {APP_NAME}
            </span>
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
