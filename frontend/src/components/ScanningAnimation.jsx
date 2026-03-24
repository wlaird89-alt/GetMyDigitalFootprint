import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';

const scanMessages = [
  '[+] Initializing OSINT sequence...',
  '[+] Scanning social matrices...',
  '[+] Querying platform databases...',
  '[+] Analyzing digital footprint...',
  '[+] Cross-referencing usernames...',
  '[+] Aggregating search results...',
  '[+] Calculating risk score...',
  '[+] Compiling report data...',
];

export default function ScanningAnimation({ username }) {
  const [currentMessages, setCurrentMessages] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let currentIdx = 0;
    const messageInterval = setInterval(() => {
      if (currentIdx < scanMessages.length) {
        const msgToAdd = scanMessages[currentIdx];
        setCurrentMessages(prev => [...prev, msgToAdd]);
        currentIdx++;
      } else {
        clearInterval(messageInterval);
      }
    }, 300);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="min-h-screen cyber-grid-bg flex items-center justify-center px-6" data-testid="scanning-animation">
      <div className="glass-card p-8 max-w-lg w-full">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Shield className="w-8 h-8 text-cyan-400 animate-pulse" />
          <span className="text-xl font-bold text-white font-['Outfit']">
            Instagoogleface<span className="text-cyan-400">.com</span>
          </span>
        </div>

        {/* Target Username */}
        <div className="text-center mb-6">
          <p className="text-slate-500 text-sm">Scanning target</p>
          <p className="text-2xl font-mono font-bold text-cyan-400">@{username}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-right text-sm text-slate-500 mt-1 font-mono">{progress}%</p>
        </div>

        {/* Terminal Output */}
        <div className="bg-slate-900/80 rounded-lg p-4 font-mono text-sm h-48 overflow-hidden">
          <div className="space-y-1">
            {currentMessages.map((msg, idx) => (
              <div 
                key={idx} 
                className="terminal-text animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s`, opacity: 0 }}
              >
                <span className="text-emerald-400">[+]</span>
                <span className="text-cyan-400 ml-1">{msg ? msg.replace('[+] ', '') : ''}</span>
              </div>
            ))}
            {currentMessages.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="w-2 h-4 bg-cyan-400 animate-pulse"></span>
              </div>
            )}
          </div>
        </div>

        {/* Scan Line Effect */}
        <div className="relative h-1 mt-4 bg-slate-800 rounded overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent scan-line" />
        </div>
      </div>
    </div>
  );
}
