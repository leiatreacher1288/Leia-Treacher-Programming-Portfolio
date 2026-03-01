import React from 'react';
import {
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiUsers,
  FiDatabase,
  FiFileText,
  FiDownload,
  FiTrash2,
} from 'react-icons/fi';

export const ComplianceProcedures = () => {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <FiShield className="w-16 h-16 text-primary-btn" />
          </div>
          <h1 className="text-3xl font-bold text-heading dark:text-heading-dark mb-4">
            Compliance Procedures
          </h1>
          <p className="text-lg text-card-info dark:text-card-info-dark">
            GDPR/FIPPA Compliance Guidelines for ExamVault
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Overview */}
          <section className="bg-card dark:bg-card-dark p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-heading dark:text-heading-dark mb-4 flex items-center gap-2">
              <FiCheckCircle />
              Overview
            </h2>
            <p className="text-card-info dark:text-card-info-dark leading-relaxed">
              These procedures outline how ExamVault handles data requests,
              privacy incidents, and compliance requirements in accordance with
              GDPR and FIPPA regulations. All procedures are designed to ensure
              timely, secure, and compliant data handling.
            </p>
          </section>

          {/* Data Export Procedures */}
          <section className="bg-card dark:bg-card-dark p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-heading dark:text-heading-dark mb-4 flex items-center gap-2">
              <FiDownload />
              Data Export Procedures
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-heading dark:text-heading-dark mb-2">
                  Right of Access Requests
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <FiClock className="w-5 h-5 text-primary-btn mt-0.5" />
                    <div>
                      <p className="font-medium text-heading dark:text-heading-dark">
                        Response Time
                      </p>
                      <p className="text-card-info dark:text-card-info-dark">
                        All requests must be processed within 30 days
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiFileText className="w-5 h-5 text-primary-btn mt-0.5" />
                    <div>
                      <p className="font-medium text-heading dark:text-heading-dark">
                        Data Format
                      </p>
                      <p className="text-card-info dark:text-card-info-dark">
                        JSON format with comprehensive metadata
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiUsers className="w-5 h-5 text-primary-btn mt-0.5" />
                    <div>
                      <p className="font-medium text-heading dark:text-heading-dark">
                        Scope
                      </p>
                      <p className="text-card-info dark:text-card-info-dark">
                        Includes all personal data, courses, exams, and student
                        information
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Data Deletion Procedures */}
          <section className="bg-card dark:bg-card-dark p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-heading dark:text-heading-dark mb-4 flex items-center gap-2">
              <FiTrash2 />
              Data Deletion Procedures
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-heading dark:text-heading-dark mb-2">
                  Right to Erasure
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <FiAlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium text-heading dark:text-heading-dark">
                        Verification Required
                      </p>
                      <p className="text-card-info dark:text-card-info-dark">
                        Identity verification before processing deletion
                        requests
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiClock className="w-5 h-5 text-primary-btn mt-0.5" />
                    <div>
                      <p className="font-medium text-heading dark:text-heading-dark">
                        Processing Time
                      </p>
                      <p className="text-card-info dark:text-card-info-dark">
                        Complete deletion within 45 days
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiDatabase className="w-5 h-5 text-primary-btn mt-0.5" />
                    <div>
                      <p className="font-medium text-heading dark:text-heading-dark">
                        Scope
                      </p>
                      <p className="text-card-info dark:text-card-info-dark">
                        All personal data, backups, and associated records
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Data Anonymization Procedures */}
          <section className="bg-card dark:bg-card-dark p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-heading dark:text-heading-dark mb-4 flex items-center gap-2">
              <FiUsers />
              Data Anonymization Procedures
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-heading dark:text-heading-dark mb-2">
                  Archive Mode
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <FiShield className="w-5 h-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium text-heading dark:text-heading-dark">
                        Data Preservation
                      </p>
                      <p className="text-card-info dark:text-card-info-dark">
                        Analytics and system integrity maintained
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiFileText className="w-5 h-5 text-primary-btn mt-0.5" />
                    <div>
                      <p className="font-medium text-heading dark:text-heading-dark">
                        Anonymization Process
                      </p>
                      <p className="text-card-info dark:text-card-info-dark">
                        Names and emails replaced with random tokens
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiClock className="w-5 h-5 text-primary-btn mt-0.5" />
                    <div>
                      <p className="font-medium text-heading dark:text-heading-dark">
                        Processing Time
                      </p>
                      <p className="text-card-info dark:text-card-info-dark">
                        Anonymization completed within 7 days
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Incident Response */}
          <section className="bg-card dark:bg-card-dark p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-heading dark:text-heading-dark mb-4 flex items-center gap-2">
              <FiAlertTriangle />
              Incident Response Procedures
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-heading dark:text-heading-dark mb-2">
                    Data Breach Response
                  </h3>
                  <ol className="list-decimal list-inside text-card-info dark:text-card-info-dark space-y-2 ml-4">
                    <li>Immediate containment and assessment</li>
                    <li>
                      Notification to relevant authorities within 72 hours
                    </li>
                    <li>Affected users notified within 24 hours</li>
                    <li>Comprehensive investigation and documentation</li>
                    <li>Implementation of corrective measures</li>
                  </ol>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-heading dark:text-heading-dark mb-2">
                    Privacy Incident Reporting
                  </h3>
                  <ol className="list-decimal list-inside text-card-info dark:text-card-info-dark space-y-2 ml-4">
                    <li>Immediate reporting to privacy officer</li>
                    <li>Assessment of impact and scope</li>
                    <li>Documentation of incident details</li>
                    <li>Implementation of remediation steps</li>
                    <li>Review and update of procedures</li>
                  </ol>
                </div>
              </div>
            </div>
          </section>

          {/* Audit Procedures */}
          <section className="bg-card dark:bg-card-dark p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-heading dark:text-heading-dark mb-4 flex items-center gap-2">
              <FiFileText />
              Audit and Monitoring
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-heading dark:text-heading-dark mb-2">
                  Audit Log Requirements
                </h3>
                <ul className="list-disc list-inside text-card-info dark:text-card-info-dark space-y-2 ml-4">
                  <li>All data access and modifications logged</li>
                  <li>Privacy compliance actions tracked</li>
                  <li>Retention period: 7 years minimum</li>
                  <li>Regular audit log reviews</li>
                  <li>Export capability for compliance reviews</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-card dark:bg-card-dark p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-heading dark:text-heading-dark mb-4">
              Contact Information
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-heading dark:text-heading-dark mb-2">
                  Privacy Officer
                </h3>
                <p className="text-card-info dark:text-card-info-dark">
                  Email: privacy@examvault.com
                  <br />
                  Response time: Within 24 hours
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-heading dark:text-heading-dark mb-2">
                  Emergency Contact
                </h3>
                <p className="text-card-info dark:text-card-info-dark">
                  For urgent privacy incidents: security@examvault.com
                  <br />
                  Response time: Within 4 hours
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
