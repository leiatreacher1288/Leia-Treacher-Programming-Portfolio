# Nivo Line Chart Implementation

## Overview

The `CourseStatisticsDisplay` component now uses the **Nivo ResponsiveLine** component instead of a custom SVG implementation. This provides better performance, built-in animations, and professional chart features.

## Dependencies

- `@nivo/core@0.99.0` - Core Nivo functionality
- `@nivo/line@0.99.0` - Line chart component

## Key Features Implemented

### 1. Data Structure

The component transforms course statistics data into Nivo's expected format:

```typescript
const chartData = [
  {
    id: 'performance',
    color: '#3B82F6',
    data: statistics.historicalData.map((item) => ({
      x: `${item.term} ${item.year}`,
      y: item.average,
      // Additional data for tooltip
      term: item.term,
      year: item.year,
      semester: item.semester,
      studentCount: item.studentCount,
      professor: item.professor,
      ta: item.ta,
    })),
  },
];
```

### 2. Custom Tooltip

Rich tooltips display detailed information about each data point:

- Term and year
- Average score
- Student count
- Professor name
- TA name

### 3. Responsive Design

The chart automatically adapts to container size using `ResponsiveLine`.

### 4. Professional Styling

- Custom theme matching the application design
- Smooth animations and transitions
- Interactive hover effects
- Clean grid lines and axes

## Configuration Options

### Scales

- **X-Scale**: Point scale for categorical data (terms)
- **Y-Scale**: Linear scale with automatic min/max calculation

### Axes

- **Bottom Axis**: Term labels with 45-degree rotation
- **Left Axis**: Score percentages with custom formatting

### Styling

- **Colors**: Custom blue theme (`#3B82F6`)
- **Points**: 8px circles with borders
- **Line**: 3px width with smooth curves
- **Grid**: Subtle horizontal lines

### Animations

- **Curve**: Smooth monotone interpolation
- **Motion**: Spring-based animations with custom config

## Advanced Features Available

### Multiple Lines

For course comparisons:

```typescript
const multiData = [
  { id: 'Course A', data: [...] },
  { id: 'Course B', data: [...] },
];
```

### Area Charts

Enable filled areas under lines:

```typescript
enableArea={true}
areaOpacity={0.3}
```

### Legends

Add legends for multiple series:

```typescript
legends={[
  {
    anchor: 'bottom-right',
    direction: 'column',
    // ... legend config
  },
]}
```

### Crosshair

Interactive crosshair for precise value reading:

```typescript
enableCrosshair={true}
crosshairType="bottom-left"
```

## Performance Benefits

1. **Canvas Rendering**: Better performance for large datasets
2. **Built-in Optimization**: Automatic rendering optimizations
3. **Memory Efficient**: Proper cleanup and re-rendering
4. **Animation Framework**: Hardware-accelerated animations

## Customization Examples

### Different Chart Types

```typescript
// Area chart
<ResponsiveLine enableArea={true} />

// Step chart
<ResponsiveLine curve="step" />

// Dashed lines
<ResponsiveLine
  lineWidth={2}
  enablePointLabel={true}
  pointLabel="y"
/>
```

### Color Schemes

```typescript
// Multiple colors
colors={['#3B82F6', '#10B981', '#F59E0B']}

// Custom color function
colors={{ scheme: 'nivo' }}
```

### Interactive Features

```typescript
// Click handlers
onClick={(point, event) => {
  console.log('Clicked:', point);
}}

// Custom markers
markers={[
  {
    axis: 'y',
    value: 80,
    lineStyle: { stroke: '#f47560', strokeWidth: 2 },
    legend: 'Target Score',
  },
]}
```

## Migration Benefits

### Before (Custom SVG)

- Manual scale calculations
- Custom tooltip positioning
- Manual grid line generation
- No built-in animations
- Complex interaction handling

### After (Nivo)

- Automatic scale generation
- Built-in tooltip system
- Professional grid and axes
- Smooth animations
- Rich interaction features

## Usage in Other Components

The same pattern can be applied to other analytics components:

- Exam performance trends
- Question difficulty analysis
- Student progress tracking
- Course comparison charts

## Resources

- [Nivo Line Documentation](https://nivo.rocks/line/)
- [Nivo Storybook](https://nivo.rocks/storybook/)
- [Configuration Options](https://nivo.rocks/line/api/)
