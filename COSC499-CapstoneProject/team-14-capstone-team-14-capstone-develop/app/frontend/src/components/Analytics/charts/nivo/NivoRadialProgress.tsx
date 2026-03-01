import { ResponsiveRadialBar } from '@nivo/radial-bar';
import React from 'react';

interface NivoRadialProgressProps {
  value: number; // 0-100
  label?: string;
  height?: number;
}

export const NivoRadialProgress: React.FC<NivoRadialProgressProps> = ({
  value,
  label = '',
  height = 260,
}) => {
  // Nivo RadialBar expects an array of data objects
  const data = [
    {
      id: label || 'Score',
      data: [
        {
          x: label || 'Score',
          y: value,
        },
      ],
    },
  ];

  return (
    <div
      style={{
        height,
        width: height,
        position: 'relative',
        // backgroundColor: '#f0f0f0', // Uncomment for debug alignment
      }}
      className="relative mx-auto"
    >
      <ResponsiveRadialBar
        data={data}
        maxValue={100}
        startAngle={-90}
        endAngle={270}
        innerRadius={0.7} // slightly larger for more text space
        padding={0.3} // was 0.4 — tighter layout to prevent offset from center
        cornerRadius={6}
        radialAxisStart={null}
        circularAxisOuter={null}
        colors={['#6366F1']}
        enableLabels={false}
        isInteractive={false}
        legends={[]}
        animate={true}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-extrabold text-accent-indigo drop-shadow-sm">
          {value}%
        </span>
        {label && (
          <span className="mt-2 text-lg font-semibold text-heading">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};
