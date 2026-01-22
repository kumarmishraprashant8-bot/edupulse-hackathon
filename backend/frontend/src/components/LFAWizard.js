import React, { useState } from 'react';
import { exportLFA } from '../services/api';

const LFAWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    problem_statement: '',
    student_change: '',
    stakeholders: [''],
    practice_changes: [''],
    indicators: [''],
  });
  const [exportedLFA, setExportedLFA] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      // Filter out empty items
      const cleanData = {
        ...formData,
        stakeholders: formData.stakeholders.filter(s => s.trim()),
        practice_changes: formData.practice_changes.filter(p => p.trim()),
        indicators: formData.indicators.filter(i => i.trim()),
      };

      const result = await exportLFA(cleanData);
      setExportedLFA(result);
      alert('LFA exported successfully!');
    } catch (error) {
      console.error('Error exporting LFA:', error);
      alert('Failed to export LFA');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={styles.stepContent}>
            <h3>Step 1: Program Title & Problem</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>Program Title:</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., FLN Improvement Initiative 2026"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Problem Statement:</label>
              <textarea
                value={formData.problem_statement}
                onChange={(e) => handleInputChange('problem_statement', e.target.value)}
                placeholder="Describe the core problem you're addressing..."
                style={styles.textarea}
                rows={5}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div style={styles.stepContent}>
            <h3>Step 2: Desired Student Change</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>What change do you want to see in students?</label>
              <textarea
                value={formData.student_change}
                onChange={(e) => handleInputChange('student_change', e.target.value)}
                placeholder="e.g., 80% of students achieve grade-level numeracy..."
                style={styles.textarea}
                rows={5}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div style={styles.stepContent}>
            <h3>Step 3: Key Stakeholders</h3>
            <p style={styles.helpText}>Who needs to be involved?</p>
            {formData.stakeholders.map((stakeholder, index) => (
              <div key={index} style={styles.arrayItem}>
                <input
                  type="text"
                  value={stakeholder}
                  onChange={(e) => handleArrayChange('stakeholders', index, e.target.value)}
                  placeholder="e.g., Teachers, CRPs, Parents"
                  style={styles.arrayInput}
                />
                {formData.stakeholders.length > 1 && (
                  <button
                    onClick={() => removeArrayItem('stakeholders', index)}
                    style={styles.removeButton}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => addArrayItem('stakeholders')} style={styles.addButton}>
              + Add Stakeholder
            </button>
          </div>
        );

      case 4:
        return (
          <div style={styles.stepContent}>
            <h3>Step 4: Practice Changes</h3>
            <p style={styles.helpText}>What specific practices need to change?</p>
            {formData.practice_changes.map((practice, index) => (
              <div key={index} style={styles.arrayItem}>
                <input
                  type="text"
                  value={practice}
                  onChange={(e) => handleArrayChange('practice_changes', index, e.target.value)}
                  placeholder="e.g., Daily 15-min number talks"
                  style={styles.arrayInput}
                />
                {formData.practice_changes.length > 1 && (
                  <button
                    onClick={() => removeArrayItem('practice_changes', index)}
                    style={styles.removeButton}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => addArrayItem('practice_changes')} style={styles.addButton}>
              + Add Practice Change
            </button>
          </div>
        );

      case 5:
        return (
          <div style={styles.stepContent}>
            <h3>Step 5: Success Indicators</h3>
            <p style={styles.helpText}>How will you measure success?</p>
            {formData.indicators.map((indicator, index) => (
              <div key={index} style={styles.arrayItem}>
                <input
                  type="text"
                  value={indicator}
                  onChange={(e) => handleArrayChange('indicators', index, e.target.value)}
                  placeholder="e.g., Pre/post test scores"
                  style={styles.arrayInput}
                />
                {formData.indicators.length > 1 && (
                  <button
                    onClick={() => removeArrayItem('indicators', index)}
                    style={styles.removeButton}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => addArrayItem('indicators')} style={styles.addButton}>
              + Add Indicator
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>LFA (Logical Framework Analysis) Wizard</h2>
        <p>5-step guided program planning tool</p>
      </div>

      {/* Progress Bar */}
      <div style={styles.progressBar}>
        {[1, 2, 3, 4, 5].map((step) => (
          <div
            key={step}
            style={{
              ...styles.progressStep,
              ...(step <= currentStep ? styles.activeStep : {}),
            }}
          >
            {step}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div style={styles.wizardCard}>
        {renderStep()}
      </div>

      {/* Navigation */}
      <div style={styles.navigation}>
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          style={{
            ...styles.navButton,
            ...(currentStep === 1 ? styles.disabledButton : {}),
          }}
        >
          ← Back
        </button>

        {currentStep < 5 ? (
          <button onClick={handleNext} style={styles.navButton}>
            Next →
          </button>
        ) : (
          <button
            onClick={handleExport}
            disabled={loading}
            style={{...styles.navButton, ...styles.exportButton}}
          >
            {loading ? 'Exporting...' : '📄 Export LFA'}
          </button>
        )}
      </div>

      {/* Export Result */}
      {exportedLFA && (
        <div style={styles.resultCard}>
          <h3>✅ LFA Exported Successfully!</h3>
          <p>Your Logical Framework Analysis has been generated.</p>
          <a
            href={`http://localhost:8000${exportedLFA.export_url}`}
            download
            style={styles.downloadButton}
          >
            📥 Download LFA Document
          </a>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '900px',
    margin: '0 auto',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#673AB7',
    color: 'white',
    padding: '30px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  progressBar: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '30px',
    padding: '0 20px',
  },
  progressStep: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: '#ddd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '18px',
    color: '#666',
  },
  activeStep: {
    backgroundColor: '#673AB7',
    color: 'white',
  },
  wizardCard: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    minHeight: '400px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  helpText: {
    color: '#666',
    fontSize: '14px',
    marginBottom: '15px',
  },
  arrayItem: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
  },
  arrayInput: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  removeButton: {
    padding: '10px 15px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '10px',
  },
  navigation: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  navButton: {
    padding: '12px 30px',
    backgroundColor: '#673AB7',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  disabledButton: {
    backgroundColor: '#ddd',
    color: '#999',
    cursor: 'not-allowed',
  },
  exportButton: {
    backgroundColor: '#4CAF50',
  },
  resultCard: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '30px',
    borderRadius: '8px',
    textAlign: 'center',
  },
  downloadButton: {
    display: 'inline-block',
    padding: '12px 30px',
    backgroundColor: 'white',
    color: '#4CAF50',
    textDecoration: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    marginTop: '15px',
  },
};

export default LFAWizard;