// src/components/__tests__/CollaborationInvitesModal.test.tsx
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
    X: mockIcon('X'),
    UserPlus: mockIcon('UserPlus'),
    Check: mockIcon('Check'),
    XCircle: mockIcon('XCircle'),
    Users: mockIcon('Users'),
    CheckCircle2: mockIcon('CheckCircle2'),
    default: {},
  };
});

// now the rest of the usual test imports
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollaborationInvitesModal } from '../components/CollaborationInviteModal';

describe('CollaborationInvitesModal', () => {
  const mockOnClose = vi.fn();
  const mockOnAccept = vi.fn();
  const mockOnDecline = vi.fn();

  const mockInvites = [
    {
      id: 1,
      courseId: 101,
      courseCode: 'CS101',
      courseTitle: 'Introduction to Computer Science',
      inviterName: 'Dr. Smith',
      inviterEmail: 'smith@university.edu',
      role: 'SEC' as const,
      permissions: 'FULL' as const,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      courseId: 102,
      courseCode: 'MATH201',
      courseTitle: 'Advanced Mathematics',
      inviterName: 'Prof. Johnson',
      inviterEmail: 'johnson@university.edu',
      role: 'TA' as const,
      permissions: 'LIMITED' as const,
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to their default state
    mockOnAccept.mockResolvedValue(undefined);
    mockOnDecline.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    // give any pending setState a chance to run before teardown
    await new Promise((r) => setTimeout(r, 0));
  });

  it('does not render when isOpen is false', () => {
    render(
      <CollaborationInvitesModal
        isOpen={false}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        invites={mockInvites}
      />
    );

    expect(screen.queryByText('Collaboration Invites')).not.toBeInTheDocument();
  });

  it('renders modal when isOpen is true', () => {
    render(
      <CollaborationInvitesModal
        isOpen={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        invites={mockInvites}
      />
    );

    expect(screen.getByText('Collaboration Invites')).toBeInTheDocument();
  });

  it('displays "No pending invitations" when invites array is empty', () => {
    render(
      <CollaborationInvitesModal
        isOpen={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        invites={[]}
      />
    );

    expect(screen.getByText('No pending invitations')).toBeInTheDocument();
  });

  it('displays all invites with correct information', () => {
    render(
      <CollaborationInvitesModal
        isOpen={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        invites={mockInvites}
      />
    );

    // First invite
    expect(screen.getByText('CS101')).toBeInTheDocument();
    expect(
      screen.getByText('Introduction to Computer Science')
    ).toBeInTheDocument();
    expect(screen.getByText(/Dr\. Smith/)).toBeInTheDocument();
    expect(screen.getByText('Secondary Instructor')).toBeInTheDocument();
    expect(screen.getByText('Full Access')).toBeInTheDocument();

    // Second invite
    expect(screen.getByText('MATH201')).toBeInTheDocument();
    expect(screen.getByText('Advanced Mathematics')).toBeInTheDocument();
    expect(screen.getByText(/Prof\. Johnson/)).toBeInTheDocument();
    expect(screen.getByText('Teaching Assistant')).toBeInTheDocument();
    expect(screen.getByText('Limited Access')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    // Test multiple date scenarios
    const testCases = [
      {
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        expected: 'Just now',
      },
      {
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        expected: '2 hours ago',
      },
      {
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        expected: '3 days ago',
      },
      {
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        // This should show the formatted date like "Jul 14" not "7 days ago"
        expected: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      },
    ];

    testCases.forEach((testCase, index) => {
      const { unmount } = render(
        <CollaborationInvitesModal
          isOpen={true}
          onClose={mockOnClose}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          invites={[
            { ...mockInvites[0], id: index, createdAt: testCase.createdAt },
          ]}
        />
      );

      expect(screen.getByText(testCase.expected)).toBeInTheDocument();
      unmount();
    });
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();

    render(
      <CollaborationInvitesModal
        isOpen={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        invites={mockInvites}
      />
    );

    const backdrop = screen.getByTestId('modal-backdrop');
    await user.click(backdrop);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when X button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <CollaborationInvitesModal
        isOpen={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        invites={mockInvites}
      />
    );

    const closeButton = screen.getByRole('button', { name: 'X' });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onAccept with correct invite ID when Accept is clicked', async () => {
    const user = userEvent.setup();

    render(
      <CollaborationInvitesModal
        isOpen={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        invites={mockInvites}
      />
    );

    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    await user.click(acceptButtons[0]);

    await waitFor(() => {
      expect(mockOnAccept).toHaveBeenCalledWith(1);
    });
  });

  it('calls onDecline with correct invite ID when Decline is clicked', async () => {
    const user = userEvent.setup();

    render(
      <CollaborationInvitesModal
        isOpen={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        invites={mockInvites}
      />
    );

    const declineButtons = screen.getAllByRole('button', { name: /decline/i });
    await user.click(declineButtons[0]);

    await waitFor(() => {
      expect(mockOnDecline).toHaveBeenCalledWith(1);
    });
  });

  it('shows loading state when processing an invite', async () => {
    const user = userEvent.setup();

    // Make onAccept take some time but don't actually remove the invite
    let resolveAccept: () => void;
    const acceptPromise = new Promise<void>((resolve) => {
      resolveAccept = resolve;
    });
    mockOnAccept.mockReturnValue(acceptPromise);

    render(
      <CollaborationInvitesModal
        isOpen={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        invites={mockInvites}
      />
    );

    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    const declineButtons = screen.getAllByRole('button', { name: /decline/i });

    // Click the button
    await user.click(acceptButtons[0]);

    // Both buttons for this invite should be disabled immediately after clicking
    expect(acceptButtons[0]).toBeDisabled();
    expect(declineButtons[0]).toBeDisabled();

    // Verify the loading spinner is shown
    const acceptButton = acceptButtons[0];
    expect(acceptButton.querySelector('.animate-spin')).toBeInTheDocument();

    // Resolve the promise to complete the action
    resolveAccept!();

    // Wait for the component to finish processing
    await waitFor(() => {
      expect(mockOnAccept).toHaveBeenCalledWith(1);
    });
  });

  it('displays error message when accept fails', async () => {
    const user = userEvent.setup();
    mockOnAccept.mockRejectedValue(new Error('Network error'));

    render(
      <CollaborationInvitesModal
        isOpen={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        invites={mockInvites}
      />
    );

    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    await user.click(acceptButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to accept invitation. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('displays error message when decline fails', async () => {
    const user = userEvent.setup();
    mockOnDecline.mockRejectedValue(new Error('Network error'));

    render(
      <CollaborationInvitesModal
        isOpen={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        invites={mockInvites}
      />
    );

    const declineButtons = screen.getAllByRole('button', { name: /decline/i });
    await user.click(declineButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to decline invitation. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('displays correct role labels', () => {
    const invitesWithAllRoles = [
      { ...mockInvites[0], role: 'SEC' as const },
      { ...mockInvites[0], id: 3, role: 'TA' as const },
      { ...mockInvites[0], id: 4, role: 'OTH' as const },
    ];

    render(
      <CollaborationInvitesModal
        isOpen={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        invites={invitesWithAllRoles}
      />
    );

    expect(screen.getByText('Secondary Instructor')).toBeInTheDocument();
    expect(screen.getByText('Teaching Assistant')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('displays correct permission labels', () => {
    const invitesWithAllPermissions = [
      { ...mockInvites[0], permissions: 'FULL' as const },
      { ...mockInvites[0], id: 3, permissions: 'LIMITED' as const },
      { ...mockInvites[0], id: 4, permissions: 'NONE' as const },
    ];

    render(
      <CollaborationInvitesModal
        isOpen={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        invites={invitesWithAllPermissions}
      />
    );

    expect(screen.getByText('Full Access')).toBeInTheDocument();
    expect(screen.getByText('Limited Access')).toBeInTheDocument();
    expect(screen.getByText('No Access')).toBeInTheDocument();
  });
});
