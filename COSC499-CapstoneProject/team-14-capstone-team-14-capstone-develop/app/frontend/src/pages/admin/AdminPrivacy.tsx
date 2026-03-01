import { useState, useEffect, useCallback } from 'react';
import { StandardButton } from '../../components/ui/StandardButton';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { RefreshButton } from '../../components/ui/RefreshButton';
import {
  FiSearch,
  FiArchive,
  FiTrash2,
  FiDownload,
  FiEye,
  FiShield,
  FiFileText,
  FiUsers,
} from 'react-icons/fi';
import { adminStyles } from '../../utils/adminStyles';
import {
  users as usersApi,
  privacyAuditLog,
  type User,
  type UserApiResponse,
} from '../../api/adminApi';

interface AuditLogItem {
  id: string;
  user_name: string;
  user_email: string;
  action: string;
  action_display: string;
  description: string;
  admin_user: string;
  created_at: string;
  created_at_formatted: string;
  timestamp: string;
  type: string;
  severity: string;
}

export const AdminPrivacy = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditLogsPage, setAuditLogsPage] = useState(1);
  const [auditLogsTotal, setAuditLogsTotal] = useState(0);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [exportingUser, setExportingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Student search state
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
  const [searchingStudents, setSearchingStudents] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data: UserApiResponse = await usersApi.list({
        include_archived: true,
      });
      setUsers(data.results || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setErrorMessage('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to log privacy actions to backend
  const logPrivacyAction = async (
    action: string,
    description: string,
    userEmail?: string
  ) => {
    try {
      const response = await privacyAuditLog.create({
        action,
        description,
        user_email: userEmail,
        admin_user: 'Admin User',
      });
    } catch (error) {
      console.error('Failed to log privacy action:', error);
    }
  };

  const fetchAuditLogs = useCallback(async (page = 1) => {
    try {
      setAuditLogsLoading(true);
      const response = await privacyAuditLog.list({ page, page_size: 5 });
      console.log('🔍 Raw API response:', response);
      if (response.success && (response as any).logs) {
        const transformedLogs: AuditLogItem[] = (response as any).logs.map(
          (log: any) => ({
            id: log.id,
            user_name: log.admin_user,
            user_email: log.user_email,
            action: log.action,
            action_display: log.action_display,
            description: log.description,
            admin_user: log.admin_user,
            created_at: log.created_at,
            created_at_formatted: log.created_at_formatted,
            timestamp: log.created_at,
            type: 'privacy',
            severity: 'info',
          })
        );
        setAuditLogs(transformedLogs);
        setAuditLogsTotal((response as any).total_count || 0);
        setAuditLogsPage(page);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setAuditLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
  }, [fetchUsers, fetchAuditLogs]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleArchiveUser = async (userId: number) => {
    try {
      const response = await usersApi.archive(userId);
      if (response.success) {
        const user = users.find((u) => u.id === userId);
        await logPrivacyAction(
          'user_archived',
          `Archived user: ${user?.name || 'Unknown'}`,
          user?.email
        );
        setSuccessMessage('User archived successfully');
        fetchUsers();
        fetchAuditLogs();
      } else {
        setErrorMessage(response.error || 'Failed to archive user');
      }
    } catch (error) {
      console.error('Error archiving user:', error);
      setErrorMessage('Failed to archive user');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const response = await usersApi.delete(userId);
      if (response.success) {
        const user = users.find((u) => u.id === userId);
        await logPrivacyAction(
          'user_deleted',
          `Deleted user: ${user?.name || 'Unknown'}`,
          user?.email
        );
        setSuccessMessage('User deleted successfully');
        fetchUsers();
        fetchAuditLogs();
        setDeletingUser(null);
        setShowDeleteConfirm(false);
      } else {
        setErrorMessage(response.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setErrorMessage('Failed to delete user');
    }
  };

  const handleExportUserData = async (user: User) => {
    try {
      const response = await usersApi.exportData(user.id);
      if (response.success) {
        // Create and download JSON file
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `user_data_${user.id}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        await logPrivacyAction(
          'data_exported',
          `Exported data for user: ${user.name}`,
          user.email
        );
        setSuccessMessage('User data exported successfully');
        // Refresh audit logs to show the new entry
        fetchAuditLogs();
      } else {
        setErrorMessage(response.error || 'Failed to export user data');
      }
    } catch (error) {
      console.error('Error exporting user data:', error);
      setErrorMessage('Failed to export user data');
    }
  };

  const handleBulkArchive = async () => {
    try {
      const response = await usersApi.bulkArchive(Array.from(selectedUsers));
      if (response.success) {
        const userCount = Array.from(selectedUsers).length;
        await logPrivacyAction(
          'user_archived',
          `Bulk archived ${userCount} users`
        );
        setSuccessMessage(`Successfully archived ${userCount} users`);
        setSelectedUsers(new Set());
        fetchUsers();
        fetchAuditLogs();
      } else {
        setErrorMessage(response.error || 'Failed to archive users');
      }
    } catch (error) {
      console.error('Error bulk archiving users:', error);
      setErrorMessage('Failed to archive users');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const response = await usersApi.bulkDelete(Array.from(selectedUsers));
      if (response.success) {
        const userCount = Array.from(selectedUsers).length;
        await logPrivacyAction(
          'user_deleted',
          `Bulk deleted ${userCount} users`
        );
        setSuccessMessage(`Successfully deleted ${userCount} users`);
        setSelectedUsers(new Set());
        fetchUsers();
        fetchAuditLogs();
      } else {
        setErrorMessage(response.error || 'Failed to delete users');
      }
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      setErrorMessage('Failed to delete users');
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const selectAllUsers = () => {
    setSelectedUsers(new Set(filteredUsers.map((user) => user.id)));
  };

  const clearSelection = () => {
    setSelectedUsers(new Set());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Student search functionality
  const searchStudents = async () => {
    if (!studentSearchTerm.trim()) {
      setStudentSearchResults([]);
      return;
    }

    setSearchingStudents(true);
    try {
      // Search through all users' exported data to find students
      const allStudents: any[] = [];

      for (const user of users) {
        try {
          const exportData = await usersApi.exportData(user.id);
          if (
            exportData.success &&
            exportData.data &&
            typeof exportData.data === 'object' &&
            'students' in exportData.data
          ) {
            const students = (exportData.data as any).students;
            const matchingStudents = students.filter(
              (student: any) =>
                student.name
                  .toLowerCase()
                  .includes(studentSearchTerm.toLowerCase()) ||
                student.student_id
                  .toLowerCase()
                  .includes(studentSearchTerm.toLowerCase())
            );
            allStudents.push(
              ...matchingStudents.map((student: any) => ({
                ...student,
                instructor_name: user.name,
                instructor_email: user.email,
              }))
            );
          }
        } catch (error) {
          console.error(`Error searching students for user ${user.id}:`, error);
        }
      }

      setStudentSearchResults(allStudents);
    } catch (error) {
      console.error('Error searching students:', error);
      setErrorMessage('Failed to search students');
    } finally {
      setSearchingStudents(false);
    }
  };

  const handleStudentSearch = () => {
    searchStudents();
  };

  return (
    <div className={adminStyles.pageContainer}>
      {/* Action Buttons */}
      <div className="flex justify-end mb-6">
        <RefreshButton
          onClick={() => {
            fetchUsers();
            fetchAuditLogs();
          }}
          loading={loading}
        />
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}

      {/* PII Management Section */}
      <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-heading dark:text-heading-dark text-lg font-semibold mb-4 flex items-center gap-2">
            <FiShield />
            PII Management
          </h3>
          {Array.from(selectedUsers).length > 0 && (
            <div className="flex gap-2">
              <StandardButton
                color="danger-outline"
                onClick={() => setShowArchiveConfirm(true)}
                className="flex items-center gap-2"
              >
                <FiArchive />
                Archive Selected ({Array.from(selectedUsers).length})
              </StandardButton>
            </div>
          )}
        </div>

        {/* Search and Bulk Actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-btn focus:border-transparent"
              />
            </div>
            <StandardButton
              color="info-outline"
              onClick={selectAllUsers}
              disabled={filteredUsers.length === 0}
            >
              Select All
            </StandardButton>
            <StandardButton
              color="info-outline"
              onClick={clearSelection}
              disabled={Array.from(selectedUsers).length === 0}
            >
              Clear Selection
            </StandardButton>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4">
                  <input
                    type="checkbox"
                    checked={
                      Array.from(selectedUsers).length ===
                        filteredUsers.length && filteredUsers.length > 0
                    }
                    onChange={(e) =>
                      e.target.checked ? selectAllUsers() : clearSelection()
                    }
                    className="rounded"
                  />
                </th>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Created</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="py-3 px-4 font-medium">{user.name}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {user.email}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        user.is_archived
                          ? 'bg-gray-100 text-gray-800'
                          : user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.is_archived
                        ? 'Archived'
                        : user.is_active
                          ? 'Active'
                          : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <StandardButton
                        color="info-outline"
                        size="sm"
                        onClick={() => {
                          setExportingUser(user);
                          setShowExportConfirm(true);
                        }}
                        className="flex items-center gap-1"
                      >
                        <FiDownload />
                        Export
                      </StandardButton>
                      {!user.is_archived && (
                        <StandardButton
                          color="danger-outline"
                          size="sm"
                          onClick={() => handleArchiveUser(user.id)}
                          className="flex items-center gap-1"
                        >
                          <FiArchive />
                          Archive
                        </StandardButton>
                      )}
                      <StandardButton
                        color="danger-btn"
                        size="sm"
                        onClick={() => {
                          setDeletingUser(user);
                          setShowDeleteConfirm(true);
                        }}
                        className="flex items-center gap-1"
                      >
                        <FiTrash2 />
                        Delete
                      </StandardButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {loading ? 'Loading users...' : 'No users found'}
          </div>
        )}
      </div>

      {/* Audit Log Section */}
      <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-heading dark:text-heading-dark text-lg font-semibold mb-4 flex items-center gap-2">
          <FiShield />
          Privacy Audit Log
        </h3>
        <div className="space-y-3">
          {auditLogsLoading ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              Loading audit logs...
            </div>
          ) : (
            <>
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="text-lg flex-shrink-0 mt-0.5">
                    {log.action === 'user_archived' && (
                      <FiArchive className="text-orange-500" />
                    )}
                    {log.action === 'user_deleted' && (
                      <FiTrash2 className="text-red-500" />
                    )}
                    {log.action === 'data_exported' && (
                      <FiDownload className="text-blue-500" />
                    )}
                    {log.action === 'user_anonymized' && (
                      <FiEye className="text-purple-500" />
                    )}
                    {log.action === 'user_search' && (
                      <FiSearch className="text-gray-500" />
                    )}
                    {log.action === 'data_access' && (
                      <FiShield className="text-blue-500" />
                    )}
                    {log.action === 'privacy_settings_changed' && (
                      <FiShield className="text-green-500" />
                    )}
                    {![
                      'user_archived',
                      'user_deleted',
                      'data_exported',
                      'user_anonymized',
                      'user_search',
                      'data_access',
                      'privacy_settings_changed',
                    ].includes(log.action) && (
                      <FiShield className="text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-heading dark:text-heading-dark">
                        {log.user_name || 'System'}
                      </p>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          log.severity === 'warning'
                            ? 'bg-yellow-100 text-yellow-800'
                            : log.severity === 'error'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {log.action
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {log.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(log.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  No privacy-related activities found
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination Controls */}
        {auditLogsTotal > 5 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(auditLogsPage - 1) * 5 + 1} to{' '}
              {Math.min(auditLogsPage * 5, auditLogsTotal)} of {auditLogsTotal}{' '}
              entries
            </div>
            <div className="flex gap-2">
              <StandardButton
                color="secondary-btn"
                size="sm"
                onClick={() => fetchAuditLogs(auditLogsPage - 1)}
                disabled={auditLogsPage <= 1 || auditLogsLoading}
              >
                Previous
              </StandardButton>
              <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
                Page {auditLogsPage} of {Math.ceil(auditLogsTotal / 5)}
              </span>
              <StandardButton
                color="secondary-btn"
                size="sm"
                onClick={() => fetchAuditLogs(auditLogsPage + 1)}
                disabled={
                  auditLogsPage >= Math.ceil(auditLogsTotal / 5) ||
                  auditLogsLoading
                }
              >
                Next
              </StandardButton>
            </div>
          </div>
        )}
      </div>

      {/* Student Data Management Section */}
      <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <h3 className="text-heading dark:text-heading-dark text-lg font-semibold mb-4 flex items-center gap-2">
          <FiUsers />
          Student Data Management
        </h3>
        <p className="text-card-info dark:text-card-info-dark mb-4">
          Student data is included in instructor exports. For direct student
          data access, search by student ID or name below.
        </p>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by ID or name..."
              value={studentSearchTerm}
              onChange={(e) => setStudentSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-btn focus:border-transparent w-full"
            />
          </div>
          <StandardButton
            color="info-outline"
            onClick={handleStudentSearch}
            disabled={searchingStudents}
            className="flex items-center gap-2"
          >
            <FiSearch />
            {searchingStudents ? 'Searching...' : 'Search Students'}
          </StandardButton>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>• Student data is automatically included in instructor exports</p>
          <p>• Student anonymization is handled in course management</p>
          <p>• Direct student data access requires instructor permission</p>
        </div>

        {/* Student Search Results */}
        {studentSearchResults.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-heading dark:text-heading-dark mb-2">
              Search Results ({studentSearchResults.length} students found)
            </h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-60 overflow-y-auto">
              {studentSearchResults.map((student, index) => (
                <div
                  key={index}
                  className="border-b border-gray-200 dark:border-gray-700 py-2 last:border-b-0"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        ID: {student.student_id}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Course: {student.course_name} ({student.course_id})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Instructor: {student.instructor_name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {student.is_anonymized ? 'Anonymized' : 'Active'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Policy Links */}
      <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-heading dark:text-heading-dark text-lg font-semibold mb-4 flex items-center gap-2">
          <FiFileText />
          Privacy Policies
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StandardButton
            color="info-outline"
            onClick={() => window.open('/privacy-policy', '_blank')}
            className="flex items-center gap-2"
          >
            <FiFileText />
            View Privacy Policy
          </StandardButton>
          <StandardButton
            color="info-outline"
            onClick={() => window.open('/compliance-procedures', '_blank')}
            className="flex items-center gap-2"
          >
            <FiShield />
            Compliance Procedures
          </StandardButton>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        open={showArchiveConfirm}
        onConfirm={handleBulkArchive}
        onCancel={() => setShowArchiveConfirm(false)}
        title="Archive Users"
        description={`Are you sure you want to archive ${Array.from(selectedUsers).length} users? Their PII will be anonymized but exam data will be preserved for analytics.`}
        variant="warning"
        icon="warning"
      />

      <ConfirmModal
        open={showDeleteConfirm}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete Users"
        description={`Are you sure you want to permanently delete ${Array.from(selectedUsers).length} users? This action cannot be undone and all associated data will be removed.`}
        variant="danger"
        icon="warning"
      />

      <ConfirmModal
        open={showExportConfirm}
        onConfirm={() => {
          if (exportingUser) {
            handleExportUserData(exportingUser);
          }
          setShowExportConfirm(false);
          setExportingUser(null);
        }}
        onCancel={() => {
          setShowExportConfirm(false);
          setExportingUser(null);
        }}
        title="Export User Data"
        description={`Export all data for ${exportingUser?.name}? This includes user information, courses, exams, questions, and activity logs.`}
        variant="primary"
        icon="warning"
      />

      <ConfirmModal
        open={showDeleteConfirm && deletingUser !== null}
        onConfirm={() => {
          if (deletingUser) {
            handleDeleteUser(deletingUser.id);
          }
        }}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletingUser(null);
        }}
        title="Delete User"
        description={`Are you sure you want to permanently delete ${deletingUser?.name}? This action cannot be undone and all associated data will be removed.`}
        variant="danger"
        icon="warning"
      />
    </div>
  );
};
