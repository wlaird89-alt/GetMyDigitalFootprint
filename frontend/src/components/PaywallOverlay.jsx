import React from 'react';
import { Lock, ShieldAlert, Eye, AlertTriangle, Fingerprint, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';

export default function PaywallOverlay({ onUnlock, totalResults, platformsFound, isLoading }) {
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

        {/* Secure Checkout Indicator */}
        <div className="flex items-center justify-center gap-2 mb-4 text-emerald-400 text-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>Secure Checkout</span>
        </div>

        {/* CTA Button */}
        <Button 
          onClick={onUnlock}
          disabled={isLoading}
          className="btn-premium w-full text-lg"
          data-testid="unlock-premium-button"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5 mr-2" />
              Reveal My Full Digital Footprint
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-sm">€4.99</span>
            </>
          )}
        </Button>

        {/* Trust badges */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
          <span>One-time payment</span>
          <span>•</span>
          <span>Instant access</span>
          <span>•</span>
          <span>No subscription</span>
        </div>

        {/* Stripe badge */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-600">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
          </svg>
          <span>Payments securely processed by Stripe</span>
        </div>
      </div>
    </div>
  );
}
