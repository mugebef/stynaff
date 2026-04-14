import React from 'react';
import { Globe, Heart, Shield, Zap } from 'lucide-react';
import { APP_NAME, FOOTER_TEXT } from '../constants';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/5 bg-neutral-900 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white shadow-lg shadow-orange-900/20">
              <Globe size={20} />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-white">
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
