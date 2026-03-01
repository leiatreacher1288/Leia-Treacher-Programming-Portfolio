// src/components/CourseConfig/CourseSettings.tsx
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { StandardButton } from '../ui/StandardButton';
import { StandardDropdown } from '../ui/StandardDropdown';
import { InviteInstructorModal } from '../InviteInstructorModal';

import { courseAPI } from '../../api/courseAPI';
import type { Course, CourseInstructor } from '../../api/courseAPI';

/* ───────── constants ───────── */
const ACCESS_LABEL: Record<CourseInstructor['access'], string> = {
  FULL: 'Full Access',
  LIMITED: 'Limited Access',
  NONE: 'No Access',
};
const ACCESS_VALUE = Object.fromEntries(
  Object.entries(ACCESS_LABEL).map(([k, v]) => [v, k])
) as Record<string, CourseInstructor['access']>;

const ROLE_ORDER: CourseInstructor['role'][] = ['MAIN', 'SEC', 'TA', 'OTH'];
const ROLE_LABEL: Record<CourseInstructor['role'], string> = {
  MAIN: 'Main Instructor',
  SEC: 'Secondary Instructor',
  TA: 'Teaching Assistant',
  OTH: 'Other',
};

/* ───────── component ───────── */
interface CourseSettingsProps {
  courseId: number;
}

export const CourseSettings: React.FC<CourseSettingsProps> = ({ courseId }) => {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [instructors, setInstructors] = useState<CourseInstructor[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Dropdown state keyed by role */
  const [roleAccess, setRoleAccess] = useState<
    Record<CourseInstructor['role'], string>
  >({
    MAIN: ACCESS_LABEL.FULL,
    SEC: 'No Access',
    TA: 'No Access',
    OTH: 'No Access',
  });

  /* popup status message */
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  /* current user */
  const currentUserEmail =
    JSON.parse(localStorage.getItem('user') ?? '{}').email ?? '';

  /* privileges: “Main OR Full” */
  const canEditPermissions = instructors.some(
    (i) =>
      i.email === currentUserEmail &&
      i.accepted &&
      (i.role === 'MAIN' || i.access === 'FULL')
  );

  /* load course + roster */
  useEffect(() => {
    (async () => {
      try {
        const [c, roster] = await Promise.all([
          courseAPI.getCourseDetail(courseId),
          courseAPI.getInstructors(courseId),
        ]);

        setCourse(c);
        setInstructors(roster);

        /* pull defaults from the Course object first,
           then let existing instructors override */
        const init: typeof roleAccess = {
          MAIN: ACCESS_LABEL.FULL, // by definition
          SEC: ACCESS_LABEL[c.default_sec_access],
          TA: ACCESS_LABEL[c.default_ta_access],
          OTH: ACCESS_LABEL[c.default_oth_access],
        };
        roster.forEach((r) => {
          init[r.role] = ACCESS_LABEL[r.access];
        });
        setRoleAccess(init);
      } catch {
        setError('Failed to load course settings.');
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  /* handlers */
  const onAccessSelect = (role: CourseInstructor['role'], newLabel: string) =>
    setRoleAccess((prev) => ({ ...prev, [role]: newLabel }));

  /** Save‑Permissions handler */
  const savePermissions = async () => {
    if (!course) return;

    try {
      /* iterate non‑MAIN roles */
      for (const role of ROLE_ORDER.filter((r) => r !== 'MAIN')) {
        const desired = ACCESS_VALUE[roleAccess[role]];

        /* 1️⃣If course‑level default is changing → call new endpoint */
        const currentDefault =
          course[
            `default_${role.toLowerCase()}_access` as
              | 'default_sec_access'
              | 'default_ta_access'
              | 'default_oth_access'
          ];
        if (currentDefault !== desired) {
          await courseAPI.updateDefaultAccess(courseId, role, desired);
        }

        /* 2️⃣If there is exactly one instructor of that role and *their*
              access changed, patch that link as well. (Keeps UI in sync
              until they accept / refresh.) */
        const target = instructors.find((i) => i.role === role);
        if (target && target.access !== desired) {
          await courseAPI.updateInstructorAccess(courseId, target.id, desired);
        }
      }

      setStatusMsg('Permissions saved successfully');
    } catch {
      setStatusMsg('Permissions not saved');
    }
  };

  const handleInvite = async (email: string, role: string) => {
    await courseAPI.inviteCollaborator(
      courseId,
      email,
      role as 'SEC' | 'TA' | 'OTH'
    );
    setStatusMsg('Invitation sent');
  };

  /* render states */
  if (loading)
    return (
      <Panel>
        <Centered>Loading…</Centered>
      </Panel>
    );
  if (error)
    return (
      <Panel>
        <Centered className="text-red-600">{error}</Centered>
      </Panel>
    );

  const grouped = ROLE_ORDER.map((role) => ({
    role,
    label: ROLE_LABEL[role],
    members: instructors.filter((i) => i.role === role),
  }));

  /* ───────── UI ───────── */
  return (
    <>
      <div className="space-y-8">
        {/* Course Access Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Course Access (Admin)
              </h2>
              <p className="text-gray-600">
                Manage who has access to this course and their roles
              </p>
            </div>
            <StandardButton
              onClick={() => setInviteOpen(true)}
              color="primary-btn"
              size="lg"
            >
              Invite Collaborator
            </StandardButton>
          </div>

          {/* Instructor Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {grouped.map(({ role, label, members }) => (
              <div
                key={role}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                <div className="bg-gradient-to-r from-primary-btn to-primary-btn-hover px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">{label}</h3>
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="text-white text-sm font-bold">
                        {members.length}{' '}
                        {members.length === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {members.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-gray-400 text-2xl">+</span>
                      </div>
                      <p className="text-gray-500 text-sm">
                        No {label.toLowerCase()} assigned
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Click "Invite Collaborator" to add one
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {members.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-btn to-primary-btn-hover rounded-full flex items-center justify-center shadow-sm">
                              <span className="text-white text-lg font-semibold">
                                {m.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {m.name}
                              </p>
                              <p className="text-sm text-gray-600">{m.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!m.accepted && (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full border border-yellow-200">
                                Pending
                              </span>
                            )}
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Permissions Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Permissions
              </h2>
              <p className="text-gray-600">
                Configure access levels for different instructor roles
              </p>
            </div>

            {canEditPermissions && (
              <StandardButton
                onClick={savePermissions}
                color="primary-btn"
                size="lg"
              >
                Save Permissions
              </StandardButton>
            )}
          </div>

          {!canEditPermissions && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> Only Main / Full-access users can change
                permissions
              </p>
            </div>
          )}

          {/* Permissions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ROLE_ORDER.filter((r) => r !== 'MAIN').map((role) => (
              <div
                key={role}
                className="bg-gray-50 rounded-lg p-6 border border-gray-100"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {ROLE_LABEL[role]}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {role === 'SEC' &&
                      'Secondary instructors with limited access'}
                    {role === 'TA' &&
                      'Teaching assistants with restricted permissions'}
                    {role === 'OTH' &&
                      'Other collaborators with minimal access'}
                  </p>
                </div>

                {canEditPermissions ? (
                  <StandardDropdown
                    options={Object.values(ACCESS_LABEL)}
                    value={roleAccess[role]}
                    onChange={(l) => onAccessSelect(role, l)}
                  />
                ) : (
                  <div className="p-3 bg-white rounded-md border border-gray-200">
                    <span className="text-gray-900 font-medium">
                      {roleAccess[role]}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* invite‑modal */}
      <InviteInstructorModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
        permissions={{
          SEC: roleAccess.SEC,
          TA: roleAccess.TA,
          OTH: roleAccess.OTH,
        }}
      />

      {/* status popup */}
      {statusMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setStatusMsg(null)}
          />
          <div className="relative bg-white rounded-lg p-6 max-w-sm w-full">
            <p className="text-gray-900 mb-4">{statusMsg}</p>
            <button
              onClick={() => setStatusMsg(null)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};

/* helpers */
const Panel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="w-full bg-card p-8 rounded-xl shadow-sm mb-6 text-base sm:text-lg">
    {children}
  </div>
);
const Centered: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div
    className={`flex items-center justify-center py-12 text-gray-500 ${className}`}
  >
    {children}
  </div>
);

CourseSettings.propTypes = { courseId: PropTypes.number.isRequired };
