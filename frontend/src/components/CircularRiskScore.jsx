import React from 'react';

export default function CircularRiskScore({ score, level, size = 'default' }) {
  const dimensions = size === 'large' ? 160 : 120;
  const strokeWidth = size === 'large' ? 10 : 8;
  const radius = (dimensions - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getStrokeColor = () => {
    if (score < 30) return '#10B981'; // emerald
    if (score < 60) return '#F59E0B'; // amber
    return '#EF4444'; // red
  };

  const getGlowColor = () => {
    if (score < 30) return 'rgba(16, 185, 129, 0.3)';
    if (score < 60) return 'rgba(245, 158, 11, 0.3)';
    return 'rgba(239, 68, 68, 0.3)';
  };

  return (
    <div className="relative" style={{ width: dimensions, height: dimensions }}>
      <svg
        width={dimensions}
        height={dimensions}
        viewBox={`0 0 ${dimensions} ${dimensions}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={dimensions / 2}
          cy={dimensions / 2}
          r={radius}
          fill="none"
          stroke="rgba(51, 65, 85, 0.5)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={dimensions / 2}
          cy={dimensions / 2}
          r={radius}
          fill="none"
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1s ease-out, stroke 0.3s ease',
            filter: `drop-shadow(0 0 8px ${getGlowColor()})`
          }}
        />
      </svg>
      
      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className="font-mono font-bold"
          style={{ 
            fontSize: size === 'large' ? '2.5rem' : '2rem',
            color: getStrokeColor()
          }}
          data-testid="risk-score-value"
        >
          {score}
        </span>
        <span className="text-slate-500 text-xs uppercase tracking-wider">
          / 100
        </span>
      </div>
    </div>
  );
}
