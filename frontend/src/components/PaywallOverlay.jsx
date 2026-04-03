import React from 'react';
import { Lock, ShieldAlert, Eye, AlertTriangle, Fingerprint } from 'lucide-react';
import { Button } from './ui/button';

export default function PaywallOverlay({ onUnlock, totalResults, platformsFound }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
      <div className="glass-card paywall-overlay p-8 max-w-md w-full text-center pointer-events-auto animate-fade-in-up">
        {/* Lock Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
          <Fingerprint className="w-8 h-8 text-cyan-400" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">
          Reveal Your Full Digital Footprint
        </h3>

        {/* Description */}
        <p className="text-slate-400 mb-6">
          We detected multiple potential risks. Get complete visibility into what the internet knows about you.
        </p>

        {/* Stats Preview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center justify-center gap-2 text-cyan-400 mb-1">
              <Eye className="w-4 h-4" />
              <span className="font-mono font-bold">{platformsFound}+</span>
            </div>
            <span className="text-xs text-slate-500">Platforms Found</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center justify-center gap-2 text-amber-400 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-mono font-bold">{totalResults || 0}+</span>
            </div>
            <span className="text-xs text-slate-500">Results Hidden</span>
          </div>
        </div>

        {/* What you get */}
        <div className="text-left mb-6 space-y-2">
          <p className="text-sm text-slate-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            Complete list of all platforms
          </p>
          <p className="text-sm text-slate-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            All search result mentions
          </p>
          <p className="text-sm text-slate-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            Detailed risk explanations
          </p>
          <p className="text-sm text-slate-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            Actionable privacy recommendations
          </p>
        </div>

        {/* CTA Button */}
        <Button 
          onClick={onUnlock}
          className="btn-premium w-full text-lg"
          data-testid="unlock-premium-button"
        >
          <Lock className="w-5 h-5 mr-2" />
          Reveal My Full Digital Footprint
          <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-sm">€4.99</span>
        </Button>

        {/* Trust badges */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
          <span>One-time payment</span>
          <span>•</span>
          <span>Instant access</span>
          <span>•</span>
          <span>No subscription</span>
        </div>
      </div>
    </div>
  );
}
