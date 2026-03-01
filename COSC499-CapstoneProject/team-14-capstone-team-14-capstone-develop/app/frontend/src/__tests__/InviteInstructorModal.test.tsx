// src/components/__tests__/InviteInstructorModal.test.tsx
import React from 'react';
import { vi } from 'vitest';

// 🠗 mock first — this runs before any lucide-react import is executed
vi.mock('lucide-react', () => {
  const mockIcon = (name: string) => {
    const MockedIcon = (props: any) => {
      return React.createElement(
        'div',
        {
          'data-testid': `icon-${name.toLowerCase()}`,
          className: props.className,
          ...props,
        },
        name
      );
    };
    MockedIcon.displayName = name;
    return MockedIcon;
  };

  return {
    Mail: mockIcon('Mail'),
    User: mockIcon('User'),
    Send: mockIcon('Send'),
    X: mockIcon('X'),
    CheckCircle2: mockIcon('CheckCircle2'),
    default: {},
  };
});

// now the rest of the usual test imports
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InviteInstructorModal } from '../components/InviteInstructorModal';

describe('InviteInstructorModal', () => {
  const mockOnClose = vi.fn();
  const mockOnInvite = vi.fn();

  const defaultPermissions = {
    SEC: 'Full Access',
    TA: 'Limited Access',
    OTH: 'No Access',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to their default state
    mockOnInvite.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    // give any pending setState a chance to run before teardown
    await new Promise((r) => setTimeout(r, 0));
  });

  it('does not render when isOpen is false', () => {
    render(
      <InviteInstructorModal
        isOpen={false}
        onClose={mockOnClose}
        onInvite={mockOnInvite}
      />
    );

    expect(
      screen.queryByText('Invite Course Collaborator')
    ).not.toBeInTheDocument();
  });

  it('renders modal when isOpen is true', () => {
    render(
      <InviteInstructorModal
        isOpen={true}
        onClose={mockOnClose}
        onInvite={mockOnInvite}
      />
    );

    expect(screen.getByText('Invite Course Collaborator')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Collaborator Role')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /send invitation/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('has default role set to SEC (Secondary Instructor)', () => {
    render(
      <InviteInstructorModal
        isOpen={true}
        onClose={mockOnClose}
        onInvite={mockOnInvite}
      />
    );

    const roleSelect = screen.getByLabelText(
      'Collaborator Role'
    ) as HTMLSelectElement;
    expect(roleSelect.value).toBe('SEC');
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();

    render(
      <InviteInstructorModal
        isOpen={true}
        onClose={mockOnClose}
        onInvite={mockOnInvite}
      />
    );

    const backdrop = screen.getByTestId('modal-backdrop');
    await user.click(backdrop);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <InviteInstructorModal
        isOpen={true}
        onClose={mockOnClose}
        onInvite={mockOnInvite}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('validates email input is required', async () => {
    const user = userEvent.setup();
    render(
      <InviteInstructorModal
        isOpen={true}
        onClose={mockOnClose}
        onInvite={mockOnInvite}
      />
    );

    const submitButton = screen.getByRole('button', {
      name: /send invitation/i,
    });
    await user.click(submitButton);

    // Form should not submit with empty email
    expect(mockOnInvite).not.toHaveBeenCalled();
  });

  it('submits form with correct data for SEC role', async () => {
    const user = userEvent.setup();
    mockOnInvite.mockResolvedValue(undefined);

    render(
      <InviteInstructorModal
        isOpen={true}
        onClose={mockOnClose}
        onInvite={mockOnInvite}
      />
    );
    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', {
      name: /send invitation/i,
    });

    await user.type(emailInput, 'instructor@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnInvite).toHaveBeenCalledWith(
        'instructor@example.com',
        'SEC'
      );
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('submits form with TA (Teaching Assistant) role', async () => {
    const user = userEvent.setup();
    mockOnInvite.mockResolvedValue(undefined);

    render(
      <InviteInstructorModal
        isOpen={true}
        onClose={mockOnClose}
        onInvite={mockOnInvite}
      />
    );

    const emailInput = screen.getByLabelText('Email Address');
    const roleSelect = screen.getByLabelText('Collaborator Role');
    const submitButton = screen.getByRole('button', {
      name: /send invitation/i,
    });

    await user.type(emailInput, 'ta@example.com');
    await user.selectOptions(roleSelect, 'TA');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnInvite).toHaveBeenCalledWith('ta@example.com', 'TA');
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('submits form with OTH (Other) role', async () => {
    const user = userEvent.setup();
    mockOnInvite.mockResolvedValue(undefined);

    render(
      <InviteInstructorModal
        isOpen={true}
        onClose={mockOnClose}
        onInvite={mockOnInvite}
      />
    );

    const emailInput = screen.getByLabelText('Email Address');
    const roleSelect = screen.getByLabelText('Collaborator Role');
    const submitButton = screen.getByRole('button', {
      name: /send invitation/i,
    });

    await user.type(emailInput, 'other@example.com');
    await user.selectOptions(roleSelect, 'OTH');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnInvite).toHaveBeenCalledWith('other@example.com', 'OTH');
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('displays role permissions when permissions prop is provided', () => {
    render(
      <InviteInstructorModal
        isOpen={true}
        onClose={mockOnClose}
        onInvite={mockOnInvite}
        permissions={defaultPermissions}
      />
    );

    // Should show permission for default SEC role
    expect(screen.getByText(/This role will have/)).toBeInTheDocument();
    expect(screen.getByText('Full Access')).toBeInTheDocument();
  });

  it('updates permission display when role changes', async () => {
    const user = userEvent.setup();

    render(
      <InviteInstructorModal
        isOpen={true}
        onClose={mockOnClose}
        onInvite={mockOnInvite}
        permissions={defaultPermissions}
      />
    );

    const roleSelect = screen.getByLabelText('Collaborator Role');

    // Change to TA role
    await user.selectOptions(roleSelect, 'TA');

    // Should show Limited Access for TA role
    expect(screen.getByText('Limited Access')).toBeInTheDocument();
  });

  it('shows custom error message from backend response', async () => {
    const user = userEvent.setup();

    // Mock error with response data
    const customError = {
      response: {
        data: {
          error: 'User already exists in this course',
        },
      },
    };
    mockOnInvite.mockRejectedValue(customError);

    render(
      <InviteInstructorModal
        isOpen={true}
        onClose={mockOnClose}
        onInvite={mockOnInvite}
      />
    );

    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', {
      name: /send invitation/i,
    });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    // Wait for the custom error message to appear
    await waitFor(() => {
      expect(
        screen.getByText('User already exists in this course')
      ).toBeInTheDocument();
    });
  });

  it('has proper ARIA labels and accessibility', () => {
    render(
      <InviteInstructorModal
        isOpen={true}
        onClose={mockOnClose}
        onInvite={mockOnInvite}
      />
    );

    // Check that form elements have proper labels
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Collaborator Role')).toBeInTheDocument();

    // Check that email input has proper attributes
    const emailInput = screen.getByLabelText('Email Address');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');
    expect(emailInput).toHaveAttribute(
      'placeholder',
      'collaborator@university.edu'
    );
  });

  it('clears form and closes modal on successful submission', async () => {
    const user = userEvent.setup();
    mockOnInvite.mockResolvedValue(undefined);

    render(
      <InviteInstructorModal
        isOpen={true}
        onClose={mockOnClose}
        onInvite={mockOnInvite}
      />
    );

    const emailInput = screen.getByLabelText(
      'Email Address'
    ) as HTMLInputElement;
    const submitButton = screen.getByRole('button', {
      name: /send invitation/i,
    });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnInvite).toHaveBeenCalledWith('test@example.com', 'SEC');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('displays permission details section', () => {
    render(
      <InviteInstructorModal
        isOpen={true}
        onClose={mockOnClose}
        onInvite={mockOnInvite}
      />
    );

    expect(screen.getByText('Permission Details:')).toBeInTheDocument();
    expect(screen.getByText(/Full Access:/)).toBeInTheDocument();
    expect(screen.getByText(/Limited Access:/)).toBeInTheDocument();
    expect(screen.getByText(/No Access:/)).toBeInTheDocument();
  });
});
