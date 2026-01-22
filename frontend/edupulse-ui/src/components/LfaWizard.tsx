import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { lfaApi, LFAExportResponse, triggerDownload } from '../lib/api';

interface LfaWizardProps {
  mockMode: boolean;
  onToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const STEPS = [
  'Problem Statement',
  'Student Change',
  'Stakeholders',
  'Practice Changes',
  'Indicators',
];

const EXAMPLE_DATA = {
  title: 'FLN Intervention 2026',
  problem_statement: '40% of students in grades 1-3 are below grade level in numeracy, with limited access to quality learning materials and teacher support.',
  student_change: '80% of students achieve grade-level numeracy by end of academic year, with improved confidence and engagement in math activities.',
  stakeholders: ['Teachers', 'CRPs (Cluster Resource Persons)', 'Parents', 'Block Education Officers', 'School Principals'],
  practice_changes: [
    'Daily 15-minute number talks in all classrooms',
    'Use of concrete manipulatives (pebbles, blocks) for hands-on learning',
    'Weekly parent engagement sessions with take-home activities',
    'Monthly CRP classroom visits for coaching and support',
  ],
  indicators: [
    'Pre/post test scores showing 40% improvement in numeracy',
    'Student attendance rate above 85%',
    'Parent participation in engagement sessions above 60%',
    'Teacher confidence scores (self-assessment) above 7/10',
  ],
};

const LFA_TIPS = [
  'Be specific about the problem. Use data if available (e.g., "40% below grade level").',
  'Focus on measurable student outcomes. What will success look like?',
  'Include all key actors who will be involved in the intervention.',
  'List concrete changes in teaching practices, not just goals.',
  'Choose indicators that can be measured regularly and are directly linked to your student change goal.',
];

export default function LfaWizard({ mockMode, onToast }: LfaWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    problem_statement: '',
    student_change: '',
    stakeholders: [''],
    practice_changes: [''],
    indicators: [''],
  });
  const [loading, setLoading] = useState(false);
  const [exportResult, setExportResult] = useState<LFAExportResponse | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLoadExample = () => {
    setFormData({
      title: EXAMPLE_DATA.title,
      problem_statement: EXAMPLE_DATA.problem_statement,
      student_change: EXAMPLE_DATA.student_change,
      stakeholders: EXAMPLE_DATA.stakeholders,
      practice_changes: EXAMPLE_DATA.practice_changes,
      indicators: EXAMPLE_DATA.indicators,
    });
  };

  const handleAddItem = (field: 'stakeholders' | 'practice_changes' | 'indicators') => {
    setFormData({
      ...formData,
      [field]: [...formData[field], ''],
    });
  };

  const handleUpdateItem = (
    field: 'stakeholders' | 'practice_changes' | 'indicators',
    index: number,
    value: string
  ) => {
    const updated = [...formData[field]];
    updated[index] = value;
    setFormData({ ...formData, [field]: updated });
  };

  const handleRemoveItem = (field: 'stakeholders' | 'practice_changes' | 'indicators', index: number) => {
    const updated = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: updated.length > 0 ? updated : [''] });
  };

  const handleExport = async () => {
    setLoading(true);
    setExportResult(null);
    try {
      let result: LFAExportResponse;
      if (mockMode) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        result = {
          export_url: 'http://127.0.0.1:8000/exports/lfa_mock.pptx',
          lfa_id: 'mock-lfa-1',
        };
      } else {
        const apiResult = await lfaApi.exportLFA({
          title: formData.title,
          problem_statement: formData.problem_statement,
          student_change: formData.student_change,
          stakeholders: formData.stakeholders.filter(s => s.trim()),
          practice_changes: formData.practice_changes.filter(p => p.trim()),
          indicators: formData.indicators.filter(i => i.trim()),
        });
        
        if (apiResult.ok && apiResult.data) {
          result = apiResult.data;
          setExportResult(result);
          
          // Trigger download
          try {
            const blob = await lfaApi.downloadFile(result.export_url);
            const filename = result.export_url.split('/').pop() || 'lfa-export.pptx';
            triggerDownload(blob, filename);
            onToast?.('LFA exported and downloaded successfully!', 'success');
          } catch (downloadErr) {
            console.error('Download failed, but export succeeded:', downloadErr);
            onToast?.('LFA exported! Click download link if auto-download failed.', 'info');
          }
        } else {
          throw new Error(apiResult.error || 'Failed to export LFA');
        }
      }
    } catch (err: any) {
      console.error('Failed to export LFA:', err);
      const errorMsg = err.message || 'Failed to export LFA. Please try again.';
      onToast?.(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySummary = () => {
    const summary = `LFA Design: ${formData.title}

Problem: ${formData.problem_statement}

Desired Change: ${formData.student_change}

Stakeholders: ${formData.stakeholders.filter(s => s.trim()).join(', ')}

Practice Changes:
${formData.practice_changes.filter(p => p.trim()).map(p => `- ${p}`).join('\n')}

Indicators:
${formData.indicators.filter(i => i.trim()).map(i => `- ${i}`).join('\n')}`;

    navigator.clipboard.writeText(summary);
    alert('Summary copied to clipboard!');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
              <p className="text-sm text-blue-800">{LFA_TIPS[0]}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                placeholder="FLN Intervention 2026"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Problem Statement
              </label>
              <textarea
                value={formData.problem_statement}
                onChange={(e) => setFormData({ ...formData, problem_statement: e.target.value })}
                className="input-field min-h-[140px]"
                placeholder="40% students below grade level in numeracy..."
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800">{LFA_TIPS[1]}</p>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desired Student Change
            </label>
            <textarea
              value={formData.student_change}
              onChange={(e) => setFormData({ ...formData, student_change: e.target.value })}
              className="input-field min-h-[140px]"
              placeholder="80% achieve grade-level numeracy by end of year..."
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-3">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800">{LFA_TIPS[2]}</p>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key Stakeholders
            </label>
            {formData.stakeholders.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleUpdateItem('stakeholders', idx, e.target.value)}
                  className="input-field flex-1"
                  placeholder="e.g., Teachers, CRPs, Parents"
                />
                {formData.stakeholders.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem('stakeholders', idx)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    aria-label="Remove stakeholder"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleAddItem('stakeholders')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              + Add Stakeholder
            </button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-3">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800">{LFA_TIPS[3]}</p>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Practice Changes
            </label>
            {formData.practice_changes.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleUpdateItem('practice_changes', idx, e.target.value)}
                  className="input-field flex-1"
                  placeholder="e.g., Daily 15min number talks"
                />
                {formData.practice_changes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem('practice_changes', idx)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    aria-label="Remove practice change"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleAddItem('practice_changes')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              + Add Practice Change
            </button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-3">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800">{LFA_TIPS[4]}</p>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Success Indicators
            </label>
            {formData.indicators.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleUpdateItem('indicators', idx, e.target.value)}
                  className="input-field flex-1"
                  placeholder="e.g., Pre/post test scores"
                />
                {formData.indicators.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem('indicators', idx)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    aria-label="Remove indicator"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleAddItem('indicators')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              + Add Indicator
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card mb-6 bg-gradient-to-r from-primary-50 to-accent-50 border-2 border-primary-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">LFA Wizard</h2>
            <p className="text-gray-600">Create a Logical Framework Analysis design in 5 steps</p>
          </div>
          <button
            onClick={handleLoadExample}
            className="btn-secondary text-sm"
            aria-label="Load example data"
          >
            📋 Load Example
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card mb-6">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-sm font-medium text-primary-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-primary-600 to-accent-600 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between">
          {STEPS.map((step, idx) => (
            <div key={idx} className="flex-1 text-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mx-auto mb-2 transition-all ${
                  idx <= currentStep
                    ? 'bg-primary-600 text-white shadow-lg scale-110'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {idx + 1}
              </div>
              <p className="text-xs text-gray-600 hidden md:block">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="card mb-6"
      >
        <h3 className="text-2xl font-semibold mb-4 text-primary-700">{STEPS[currentStep]}</h3>
        {renderStep()}
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`btn-secondary ${currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          ← Back
        </button>
        {currentStep < STEPS.length - 1 ? (
          <button onClick={handleNext} className="btn-primary">
            Next →
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(true)}
              className="btn-secondary"
            >
              👁️ Preview
            </button>
            <button
              onClick={handleCopySummary}
              className="btn-secondary"
            >
              📋 Copy Summary
            </button>
            <button
              onClick={handleExport}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </span>
              ) : (
                '📥 Export PPTX'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold mb-4">LFA Design Preview</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-primary-700">Title</h4>
                  <p className="text-gray-700">{formData.title || '(Not set)'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary-700">Problem</h4>
                  <p className="text-gray-700">{formData.problem_statement || '(Not set)'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary-700">Desired Change</h4>
                  <p className="text-gray-700">{formData.student_change || '(Not set)'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary-700">Stakeholders</h4>
                  <ul className="list-disc list-inside text-gray-700">
                    {formData.stakeholders.filter(s => s.trim()).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-primary-700">Practice Changes</h4>
                  <ul className="list-disc list-inside text-gray-700">
                    {formData.practice_changes.filter(p => p.trim()).map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-primary-700">Indicators</h4>
                  <ul className="list-disc list-inside text-gray-700">
                    {formData.indicators.filter(i => i.trim()).map((ind, i) => (
                      <li key={i}>{ind}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="btn-primary w-full mt-6"
              >
                Close Preview
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Export Result */}
      <AnimatePresence>
        {exportResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card mt-6 bg-green-50 border-2 border-green-200"
          >
            <p className="text-green-800 font-semibold mb-2 text-lg">✅ Export successful!</p>
            <div className="flex gap-3">
              <a
                href={exportResult.export_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-block"
              >
                📥 Download LFA PPTX
              </a>
              <button
                onClick={handleCopySummary}
                className="btn-secondary"
              >
                📋 Copy Summary
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
