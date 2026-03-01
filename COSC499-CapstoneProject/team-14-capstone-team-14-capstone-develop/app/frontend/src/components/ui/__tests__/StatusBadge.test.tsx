import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StatusBadge } from '../StatusBadge';

// Mock lucide-react icons specifically for this test
vi.mock('lucide-react', () => ({
  CheckCircle2: (props: any) => (
    <div data-testid="checkcircle2-icon" {...props}>
      CheckCircle2Icon
    </div>
  ),
  AlertTriangle: (props: any) => (
    <div data-testid="alerttriangle-icon" {...props}>
      AlertTriangleIcon
    </div>
  ),
  Edit3: (props: any) => (
    <div data-testid="edit3-icon" {...props}>
      Edit3Icon
    </div>
  ),
}));

describe('StatusBadge', () => {
  it('should render valid status with CheckCircle2 icon', () => {
    render(<StatusBadge status="valid" />);

    expect(screen.getByText('Valid')).toBeInTheDocument();
    expect(screen.getByTestId('checkcircle2-icon')).toBeInTheDocument();
  });

  it('should render issues status with AlertTriangle icon', () => {
    render(<StatusBadge status="issues" />);

    expect(screen.getByText('Issues Found')).toBeInTheDocument();
    expect(screen.getByTestId('alerttriangle-icon')).toBeInTheDocument();
  });

  it('should render edited status with Edit3 icon', () => {
    render(<StatusBadge status="edited" />);

    expect(screen.getByText('Edited Since Export')).toBeInTheDocument();
    expect(screen.getByTestId('edit3-icon')).toBeInTheDocument();
  });
});
