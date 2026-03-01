import React from 'react';
import {
  FiShield,
  FiLock,
  FiEye,
  FiTrash2,
  FiDownload,
  FiFileText,
} from 'react-icons/fi';

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <FiShield className="w-16 h-16 text-primary-btn" />
          </div>
          <h1 className="text-3xl font-bold text-heading dark:text-heading-dark mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-card-info dark:text-card-info-dark">
            Last updated: August 6, 2025
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Overview */}
          <section className="bg-card dark:bg-card-dark p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-heading dark:text-heading-dark mb-4 flex items-center gap-2">
              <FiEye />
              Overview
            </h2>
            <p className="text-card-info dark:text-card-info-dark leading-relaxed">
              ExamVault is committed to protecting the privacy and personal
              information of all users. This policy outlines how we collect,
              use, store, and protect your data in compliance with GDPR, FIPPA,
              and other applicable privacy regulations.
            </p>
          </section>

          {/* Data Collection */}
          <section className="bg-card dark:bg-card-dark p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-heading dark:text-heading-dark mb-4 flex items-center gap-2">
              <FiFileText />
              Data We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-heading dark:text-heading-dark mb-2">
                  Instructor Information
                </h3>
                <ul className="list-disc list-inside text-card-info dark:text-card-info-dark space-y-1 ml-4">
                  <li>Name and email address</li>
                  <li>Role and permissions</li>
                  <li>Login timestamps and activity logs</li>
                  <li>Course and exam creation data</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-heading dark:text-heading-dark mb-2">
                  Student Information
                </h3>
                <ul className="list-disc list-inside text-card-info dark:text-card-info-dark space-y-1 ml-4">
                  <li>Student ID and name (when imported by instructors)</li>
                  <li>Exam results and performance data</li>
                  <li>Course enrollment information</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Usage */}
          <section className="bg-card dark:bg-card-dark p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-heading dark:text-heading-dark mb-4 flex items-center gap-2">
              <FiLock />
              How We Use Your Data
            </h2>
            <div className="space-y-4">
              <p className="text-card-info dark:text-card-info-dark">
                We use your data for the following purposes:
              </p>
              <ul className="list-disc list-inside text-card-info dark:text-card-info-dark space-y-2 ml-4">
                <li>Providing exam creation and management services</li>
                <li>Processing and storing exam results</li>
                <li>Generating analytics and performance reports</li>
                <li>Ensuring system security and preventing fraud</li>
                <li>Complying with legal and regulatory requirements</li>
              </ul>
            </div>
          </section>

          {/* Data Rights */}
          <section className="bg-card dark:bg-card-dark p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-heading dark:text-heading-dark mb-4 flex items-center gap-2">
              <FiDownload />
              Your Data Rights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-heading dark:text-heading-dark mb-2">
                  Right of Access
                </h3>
                <p className="text-card-info dark:text-card-info-dark">
                  You can request a complete export of all your personal data,
                  including courses, exams, and associated student information.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-heading dark:text-heading-dark mb-2">
                  Right to Deletion
                </h3>
                <p className="text-card-info dark:text-card-info-dark">
                  You can request complete deletion of your account and all
                  associated data, subject to legal retention requirements.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-heading dark:text-heading-dark mb-2">
                  Right to Anonymization
                </h3>
                <p className="text-card-info dark:text-card-info-dark">
                  You can request anonymization of your data while preserving
                  analytics and system integrity.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-heading dark:text-heading-dark mb-2">
                  Right to Rectification
                </h3>
                <p className="text-card-info dark:text-card-info-dark">
                  You can update or correct your personal information through
                  the admin panel or by contacting support.
                </p>
              </div>
            </div>
          </section>

          {/* Data Protection */}
          <section className="bg-card dark:bg-card-dark p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-heading dark:text-heading-dark mb-4 flex items-center gap-2">
              <FiShield />
              Data Protection
            </h2>
            <div className="space-y-4">
              <p className="text-card-info dark:text-card-info-dark">
                We implement comprehensive security measures to protect your
                data:
              </p>
              <ul className="list-disc list-inside text-card-info dark:text-card-info-dark space-y-2 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Comprehensive audit logging of all data access</li>
                <li>Regular backups with secure storage</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
