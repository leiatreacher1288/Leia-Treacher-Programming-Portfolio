// Example of using Nivo Line chart with different configurations
import React from 'react';
import { ResponsiveLine } from '@nivo/line';

// Sample data for the chart
const sampleData = [
  {
    id: 'Course Performance',
    color: '#3B82F6',
    data: [
      { x: 'W1 2020', y: 78 },
      { x: 'W2 2020', y: 82 },
      { x: 'W1 2021', y: 85 },
      { x: 'W2 2021', y: 79 },
      { x: 'W1 2022', y: 87 },
      { x: 'W2 2022', y: 90 },
      { x: 'W1 2023', y: 88 },
      { x: 'W2 2023', y: 92 },
    ],
  },
];

export const NivoLineExample = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4">Nivo Line Chart Example</h3>
      <div style={{ height: '400px' }}>
        <ResponsiveLine
          data={sampleData}
          margin={{ top: 50, right: 60, bottom: 100, left: 60 }}
          xScale={{ type: 'point' }}
          yScale={{
            type: 'linear',
            min: 'auto',
            max: 'auto',
            stacked: false,
            reverse: false,
          }}
          yFormat=" >-.1f"
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: 'Term',
            legendOffset: 80,
            legendPosition: 'middle',
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Average Score (%)',
            legendOffset: -45,
            legendPosition: 'middle',
          }}
          pointSize={10}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          pointLabelYOffset={-12}
          useMesh={true}
          enableGridX={false}
          enableGridY={true}
          gridYValues={5}
          colors={['#3B82F6']}
          lineWidth={3}
          enablePoints={true}
          enableArea={false}
          curve="monotoneX"
          animate={true}
          motionConfig={{
            mass: 1,
            tension: 120,
            friction: 14,
          }}
          // Custom tooltip
          tooltip={({ point }) => (
            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-sm">
              <div className="font-semibold text-gray-900 mb-2">
                {point.data.xFormatted}
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-600">Score:</span>
                <span className="font-medium">{point.data.yFormatted}%</span>
              </div>
            </div>
          )}
          // Theme customization
          theme={{
            background: 'transparent',
            text: {
              fontSize: 11,
              fill: '#6B7280',
              fontFamily: 'Inter, sans-serif',
            },
            axis: {
              domain: {
                line: {
                  stroke: '#E5E7EB',
                  strokeWidth: 1,
                },
              },
              legend: {
                text: {
                  fontSize: 12,
                  fill: '#374151',
                  fontWeight: 600,
                },
              },
              ticks: {
                line: {
                  stroke: '#E5E7EB',
                  strokeWidth: 1,
                },
                text: {
                  fontSize: 11,
                  fill: '#6B7280',
                },
              },
            },
            grid: {
              line: {
                stroke: '#F3F4F6',
                strokeWidth: 1,
              },
            },
            crosshair: {
              line: {
                stroke: '#3B82F6',
                strokeWidth: 1,
                strokeOpacity: 0.5,
              },
            },
          }}
        />
      </div>
    </div>
  );
};

// Example with multiple lines
export const MultiLineExample = () => {
  const multiData = [
    {
      id: 'Physics 111',
      color: '#3B82F6',
      data: [
        { x: 'W1 2020', y: 78 },
        { x: 'W2 2020', y: 82 },
        { x: 'W1 2021', y: 85 },
        { x: 'W2 2021', y: 79 },
        { x: 'W1 2022', y: 87 },
      ],
    },
    {
      id: 'Math 101',
      color: '#10B981',
      data: [
        { x: 'W1 2020', y: 85 },
        { x: 'W2 2020', y: 88 },
        { x: 'W1 2021', y: 82 },
        { x: 'W2 2021', y: 84 },
        { x: 'W1 2022', y: 90 },
      ],
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
      <h3 className="text-xl font-bold mb-4">Multi-Line Comparison</h3>
      <div style={{ height: '400px' }}>
        <ResponsiveLine
          data={multiData}
          margin={{ top: 50, right: 110, bottom: 100, left: 60 }}
          xScale={{ type: 'point' }}
          yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
          axisBottom={{
            tickRotation: -45,
            legend: 'Term',
            legendOffset: 80,
            legendPosition: 'middle',
          }}
          axisLeft={{
            legend: 'Average Score (%)',
            legendOffset: -45,
            legendPosition: 'middle',
          }}
          pointSize={8}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          useMesh={true}
          enableGridY={true}
          colors={['#3B82F6', '#10B981']}
          lineWidth={3}
          enablePoints={true}
          curve="monotoneX"
          animate={true}
          legends={[
            {
              anchor: 'bottom-right',
              direction: 'column',
              justify: false,
              translateX: 100,
              translateY: 0,
              itemsSpacing: 0,
              itemDirection: 'left-to-right',
              itemWidth: 80,
              itemHeight: 20,
              itemOpacity: 0.75,
              symbolSize: 12,
              symbolShape: 'circle',
              symbolBorderColor: 'rgba(0, 0, 0, .5)',
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemBackground: 'rgba(0, 0, 0, .03)',
                    itemOpacity: 1,
                  },
                },
              ],
            },
          ]}
        />
      </div>
    </div>
  );
};
