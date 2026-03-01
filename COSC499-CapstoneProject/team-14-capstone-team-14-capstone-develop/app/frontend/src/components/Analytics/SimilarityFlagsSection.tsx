// SimilarityFlagsSection.tsx - Updated with modal and removed refresh/search

import React, { useState, useEffect, useCallback } from 'react';
import { Flag, AlertTriangle, Shield, Filter, X } from 'lucide-react';
import type { CourseSearchResult } from '../../api/analyticsAPI';
import { analyticsAPI } from '../../api/analyticsAPI';

interface SimilarityFlagsSectionProps {
  allCourses: CourseSearchResult[];
}

interface SimilarityFlag {
  id: number;
  type: 'high' | 'medium' | 'low';
  course: string;
  exam: string;
  studentPair: {
    student1: { name: string; id: string };
    student2: { name: string; id: string };
  };
  similarityScore: number;
  flaggedQuestions: number[];
  dateDetected: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'confirmed';
  reviewer?: string;
  notes?: string;
}

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  title: string;
  description: string;
  confirmButtonText: string;
  confirmButtonColor: string;
  defaultNotes?: string;
  requireNotes?: boolean;
}

const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmButtonText,
  confirmButtonColor,
  defaultNotes = '',
  requireNotes = false,
}) => {
  const [notes, setNotes] = useState(defaultNotes);

  useEffect(() => {
    setNotes(defaultNotes);
  }, [defaultNotes, isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireNotes && !notes.trim()) {
      return;
    }
    onConfirm(notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-btn"
              onClick={onClose}
            >
              <X size={24} />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{description}</p>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Notes{' '}
                  {requireNotes && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  className="shadow-sm focus:ring-primary-btn focus:border-primary-btn block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Add your notes here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${confirmButtonColor}`}
              onClick={handleConfirm}
              disabled={requireNotes && !notes.trim()}
            >
              {confirmButtonText}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SimilarityFlagsSection: React.FC<
  SimilarityFlagsSectionProps
> = () => {
  const [flags, setFlags] = useState<SimilarityFlag[]>([]);
  const [filteredFlags, setFilteredFlags] = useState<SimilarityFlag[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    flagId: number | null;
    action: 'reviewed' | 'dismissed' | 'confirmed' | null;
  }>({ isOpen: false, flagId: null, action: null });

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getSimilarityFlags();
      setFlags(response.flags || []);
    } catch (error) {
      console.error('Error fetching similarity flags:', error);
      setFlags([]);
    } finally {
      setLoading(false);
    }
  };

  const filterFlags = useCallback(() => {
    let filtered = flags;

    if (selectedCourse !== 'all') {
      filtered = filtered.filter((flag) => flag.course === selectedCourse);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((flag) => flag.status === statusFilter);
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter((flag) => flag.type === severityFilter);
    }

    setFilteredFlags(filtered);
  }, [flags, selectedCourse, statusFilter, severityFilter]);

  useEffect(() => {
    fetchFlags();
  }, []);

  useEffect(() => {
    filterFlags();
  }, [filterFlags]);

  const getSeverityColor = (type: string) => {
    switch (type) {
      case 'high':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'low':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-red-600 bg-red-100';
      case 'reviewed':
        return 'text-blue-600 bg-blue-100';
      case 'dismissed':
        return 'text-gray-600 bg-gray-100';
      case 'confirmed':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleStatusUpdate = async (notes: string) => {
    if (!modalState.flagId || !modalState.action) return;

    try {
      const response = await analyticsAPI.updateSimilarityFlag(
        modalState.flagId,
        modalState.action,
        notes
      );

      if (response.success) {
        // Update local state
        setFlags((prevFlags) =>
          prevFlags.map((flag) =>
            flag.id === modalState.flagId
              ? {
                  ...flag,
                  status: modalState.action!,
                  reviewer: response.flag.reviewer,
                  notes: notes || flag.notes,
                }
              : flag
          )
        );
      }
    } catch (error) {
      console.error('Error updating flag:', error);
    } finally {
      setModalState({ isOpen: false, flagId: null, action: null });
    }
  };

  const openModal = (
    flagId: number,
    action: 'reviewed' | 'dismissed' | 'confirmed'
  ) => {
    setModalState({ isOpen: true, flagId, action });
  };

  const getModalConfig = () => {
    switch (modalState.action) {
      case 'reviewed':
        return {
          title: 'Mark as Reviewed',
          description: 'Add notes about your review of this similarity flag.',
          confirmButtonText: 'Mark as Reviewed',
          confirmButtonColor:
            'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          defaultNotes: 'Reviewed and requires further investigation',
          requireNotes: false,
        };
      case 'dismissed':
        return {
          title: 'Dismiss Flag',
          description: 'Please provide a reason for dismissing this flag.',
          confirmButtonText: 'Dismiss Flag',
          confirmButtonColor:
            'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
          defaultNotes: 'Dismissed as false positive',
          requireNotes: true,
        };
      case 'confirmed':
        return {
          title: 'Confirm Violation',
          description:
            'Are you sure you want to confirm this as an academic integrity violation? Please provide details.',
          confirmButtonText: 'Confirm Violation',
          confirmButtonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          defaultNotes: 'Confirmed academic integrity violation',
          requireNotes: true,
        };
      default:
        return {
          title: '',
          description: '',
          confirmButtonText: '',
          confirmButtonColor: '',
          defaultNotes: '',
          requireNotes: false,
        };
    }
  };

  const getUniqueCourseCodes = () => {
    const codes = new Set(flags.map((flag) => flag.course));
    return Array.from(codes).sort();
  };

  // Calculate statistics
  const stats = {
    highRisk: flags.filter((f) => f.type === 'high' && f.status === 'pending')
      .length,
    mediumRisk: flags.filter(
      (f) => f.type === 'medium' && f.status === 'pending'
    ).length,
    reviewed: flags.filter((f) => f.status === 'reviewed').length,
    totalFlags: flags.length,
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Flag className="text-red-600 mr-2" size={24} />
            Similarity Flags Dashboard
          </h2>
        </div>
        <p className="text-gray-600 mb-6">
          Monitor and review potential academic integrity violations detected
          through response similarity analysis across exams and assignments.
        </p>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-btn focus:border-transparent"
            >
              <option value="all">All Courses</option>
              {getUniqueCourseCodes().map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-btn focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Review</option>
              <option value="reviewed">Reviewed</option>
              <option value="dismissed">Dismissed</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-btn focus:border-transparent"
            >
              <option value="all">All Severity</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center">
              <AlertTriangle className="text-red-600 mr-2" size={20} />
              <div>
                <p className="text-sm text-red-600 font-medium">High Risk</p>
                <p className="text-xl font-bold text-red-700">
                  {stats.highRisk}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <Flag className="text-orange-600 mr-2" size={20} />
              <div>
                <p className="text-sm text-orange-600 font-medium">
                  Medium Risk
                </p>
                <p className="text-xl font-bold text-orange-700">
                  {stats.mediumRisk}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <Shield className="text-blue-600 mr-2" size={20} />
              <div>
                <p className="text-sm text-blue-600 font-medium">Reviewed</p>
                <p className="text-xl font-bold text-blue-700">
                  {stats.reviewed}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Filter className="text-gray-600 mr-2" size={20} />
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Flags</p>
                <p className="text-xl font-bold text-gray-700">
                  {stats.totalFlags}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flags List */}
      <div className="bg-white rounded-xl shadow-sm border">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-btn border-t-transparent mx-auto mb-2"></div>
            <p className="text-gray-600">Loading similarity flags...</p>
          </div>
        ) : filteredFlags.length === 0 ? (
          <div className="text-center py-12">
            <Shield size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">
              No similarity flags found matching your criteria
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredFlags.map((flag) => (
              <div key={flag.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                        flag.type
                      )}`}
                    >
                      {flag.type.toUpperCase()} RISK
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{flag.exam}</h3>
                      <p className="text-sm text-gray-600">
                        {flag.course} • Detected {flag.dateDetected}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      flag.status
                    )}`}
                  >
                    {flag.status.toUpperCase()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Student Pair
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">
                          {flag.studentPair.student1.name}
                        </span>
                        <span className="text-sm text-gray-600">
                          {flag.studentPair.student1.id}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">
                          {flag.studentPair.student2.name}
                        </span>
                        <span className="text-sm text-gray-600">
                          {flag.studentPair.student2.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Similarity Score:
                        </span>
                        <span className="font-bold text-red-600">
                          {flag.similarityScore.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Flagged Questions:
                        </span>
                        <span className="font-medium">
                          {flag.flaggedQuestions.length}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Questions: {flag.flaggedQuestions.join(', ')}
                      </div>
                    </div>
                  </div>
                </div>

                {flag.notes && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>Review Notes:</strong> {flag.notes}
                    </p>
                    {flag.reviewer && (
                      <p className="text-xs text-blue-700 mt-1">
                        Reviewed by: {flag.reviewer}
                      </p>
                    )}
                  </div>
                )}

                {flag.status === 'pending' && (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => openModal(flag.id, 'reviewed')}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Mark as Reviewed
                    </button>
                    <button
                      onClick={() => openModal(flag.id, 'dismissed')}
                      className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                    >
                      Dismiss Flag
                    </button>
                    <button
                      onClick={() => openModal(flag.id, 'confirmed')}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Confirm Violation
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      <StatusUpdateModal
        isOpen={modalState.isOpen}
        onClose={() =>
          setModalState({ isOpen: false, flagId: null, action: null })
        }
        onConfirm={handleStatusUpdate}
        {...getModalConfig()}
      />
    </div>
  );
};
