"use client";
import React, { useState } from "react";
import styles from "../page.module.css";
import { useFormContext } from "../../context/FormContext";
import { useRouter } from "next/navigation";

export default function Finish() {
  const { form, resetForm } = useFormContext();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<{ fileId: string; fileUrl: string } | null>(null);

  const handleSubmit = async () => {
    // Validate required fields
    if (!form.outputFileName || !form.targetFolderId) {
      setSubmitStatus('error');
      setErrorMessage('Please fill in the output file name and target folder on the home page.');
      return;
    }

    if (!form.accountManager) {
      setSubmitStatus('error');
      setErrorMessage('Please select an account manager on the home page.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/google-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outputFileName: form.outputFileName,
          targetFolderId: form.targetFolderId,
          formData: form
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitStatus('success');
        setSuccessData({
          fileId: data.fileId,
          fileUrl: data.fileUrl
        });
      } else {
        setSubmitStatus('error');
        setErrorMessage(data.error || 'Failed to create Google Sheet. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    resetForm();
    router.push("/");
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className={styles.page}>
      <div className={styles.centeredCard}>
        <h1 className={styles.title}>Finish</h1>
        
        {/* Form Summary */}
        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '12px', color: '#333' }}>Form Summary</h3>
          <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
            <p><strong>Output File:</strong> {form.outputFileName || 'Not specified'}</p>
            <p><strong>Target Folder:</strong> {form.targetFolderId || 'Not specified'}</p>
            <p><strong>Account Manager:</strong> {form.accountManager || 'Not selected'}</p>
            <p><strong>Client:</strong> {form.flourishClientName || 'Not specified'}</p>
            <p><strong>App:</strong> {form.appName || 'Not specified'}</p>
          </div>
        </div>

        {/* Status Messages */}
        {submitStatus === 'success' && successData && (
          <div style={{ 
            marginBottom: '24px', 
            padding: '16px', 
            backgroundColor: '#d4edda', 
            border: '1px solid #c3e6cb', 
            borderRadius: '8px',
            color: '#155724'
          }}>
            <h3 style={{ marginBottom: '8px' }}>✅ Success!</h3>
            <p>Your Google Sheet has been created successfully.</p>
            <p><strong>File ID:</strong> {successData.fileId}</p>
            <a 
              href={successData.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                display: 'inline-block', 
                marginTop: '8px', 
                padding: '8px 16px', 
                backgroundColor: '#007bff', 
                color: 'white', 
                textDecoration: 'none', 
                borderRadius: '4px' 
              }}
            >
              Open Google Sheet
            </a>
          </div>
        )}

        {submitStatus === 'error' && (
          <div style={{ 
            marginBottom: '24px', 
            padding: '16px', 
            backgroundColor: '#f8d7da', 
            border: '1px solid #f5c6cb', 
            borderRadius: '8px',
            color: '#721c24'
          }}>
            <h3 style={{ marginBottom: '8px' }}>❌ Error</h3>
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className={styles.navButtonGroup}>
          <button 
            type="button" 
            className={`${styles.navButton} ${styles.navButtonBack}`} 
            onClick={handleBack}
            disabled={isSubmitting}
          >
            Back
          </button>
          
          {submitStatus !== 'success' ? (
            <button 
              type="button" 
              className={`${styles.navButton} ${styles.navButtonNext}`} 
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{ 
                backgroundColor: isSubmitting ? '#ccc' : undefined,
                cursor: isSubmitting ? 'not-allowed' : undefined
              }}
            >
              {isSubmitting ? 'Creating Google Sheet...' : 'Create Google Sheet'}
            </button>
          ) : (
            <button 
              type="button" 
              className={`${styles.navButton} ${styles.navButtonNext}`} 
              onClick={handleFinish}
            >
              Finish and Return Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
