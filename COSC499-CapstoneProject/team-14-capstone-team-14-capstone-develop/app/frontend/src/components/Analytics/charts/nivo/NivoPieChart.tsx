import { ResponsivePie } from '@nivo/pie';
import React from 'react';

interface PieData {
  id: string;
  label: string;
  value: number;
  color?: string;
}

interface NivoPieChartProps {
  data: PieData[];
  height?: number;
  legend?: boolean;
}

const COLORS: Record<string, string> = {
  Easy: '#10B981', // accent-emerald
  Medium: '#F59E0B', // accent-amber
  Hard: '#6366F1', // accent-indigo
  Unknown: '#9CA3AF', // gray-400
};

export const NivoPieChart: React.FC<NivoPieChartProps> = ({
  data,
  height = 220,
  legend = true,
}) => {
  return (
    <div style={{ height }} className="w-full">
      <ResponsivePie
        data={data.map((d) => ({ ...d, color: COLORS[d.id] || '#9CA3AF' }))}
        margin={{ top: 20, right: 40, bottom: 60, left: 40 }}
        innerRadius={0.6}
        padAngle={2}
        cornerRadius={6}
        colors={({ id }) => COLORS[id as string] || '#9CA3AF'}
        borderWidth={2}
        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
        enableArcLabels={false}
        enableArcLinkLabels={false}
        legends={
          legend
            ? [
                {
                  anchor: 'bottom',
                  direction: 'row',
                  justify: false,
                  translateY: 36,
                  itemWidth: 70,
                  itemHeight: 16,
                  itemsSpacing: 6,
                  symbolSize: 12,
                  symbolShape: 'circle',
                  itemTextColor: '#4B5563',
                },
              ]
            : []
        }
      />
    </div>
  );
};
