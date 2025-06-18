"use client";
import React, { useState, useEffect } from "react";
import styles from "../page.module.css";
import { useFormContext } from "../../context/FormContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function Finish() {
  const { form, resetForm } = useFormContext();
  const router = useRouter();
  const pathname = usePathname();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'processing'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<{ fileId: string; fileUrl: string } | null>(null);
  const [countdown, setCountdown] = useState(5);

  // Handle countdown and redirect after success
  useEffect(() => {
    if (submitStatus === 'processing') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            resetForm();
            router.push("/");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [submitStatus, resetForm, router]);

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
        // Start the processing state after a brief moment to show success
        setTimeout(() => {
          setSubmitStatus('processing');
          setCountdown(5);
        }, 2000);
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

  // Processing/Placeholder page
  if (submitStatus === 'processing') {
    return (
      <div className={styles.page}>
        <div className={styles.centeredCard}>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              border: '4px solid #f3f3f3', 
              borderTop: '4px solid #007bff', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 24px'
            }}></div>
            <h1 style={{ marginBottom: '16px', color: '#333' }}>Google Sheet Created Successfully!</h1>
            <p style={{ fontSize: '18px', color: '#666', marginBottom: '24px' }}>
              Your Google Sheet has been created and all data has been written successfully.
            </p>
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#e7f3ff', 
              borderRadius: '8px', 
              marginBottom: '24px' 
            }}>
              <p style={{ margin: '0', fontSize: '16px', color: '#0056b3' }}>
                Redirecting to home page in <strong>{countdown}</strong> seconds...
              </p>
            </div>
            <button 
              onClick={() => {
                resetForm();
                router.push("/");
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Return Home Now
            </button>
          </div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.centeredCard}>
        <h1 className={styles.title}>Finish</h1>
        {/* Progress Bar */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 40, gap: 8 }}>
          {[
            { name: 'Home', path: '/' },
            { name: 'Client Basics', path: '/client-basics' },
            { name: 'Client Details', path: '/client-details' },
            { name: 'Add an App', path: '/add-an-app' },
            { name: 'Add Events', path: '/add-events' },
            { name: 'Add Campaign', path: '/add-campaign' },
            { name: 'Add Offers', path: '/add-offers' },
            { name: 'Add Images', path: '/add-images' },
            { name: 'Finish', path: '/finish' },
          ].map((step, idx, arr) => (
            <React.Fragment key={step.path}>
              <Link href={step.path} style={{
                padding: '6px 14px',
                borderRadius: 16,
                background: pathname === step.path ? '#1976d2' : '#e3eafc',
                color: pathname === step.path ? '#fff' : '#1976d2',
                fontWeight: pathname === step.path ? 600 : 400,
                textDecoration: 'none',
                fontSize: 15,
                border: pathname === step.path ? '2px solid #1976d2' : '2px solid #e3eafc',
                transition: 'background 0.2s, color 0.2s, border 0.2s',
                cursor: 'pointer',
              }}>{step.name}</Link>
              {idx < arr.length - 1 && <span style={{ color: '#888', margin: '0 4px', display: 'flex', alignItems: 'center' }}>→</span>}
            </React.Fragment>
          ))}
        </div>
        
        {/* Form Summary */}
        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '12px', color: '#111' }}>Form Summary</h3>
          <div style={{ fontSize: '14px', lineHeight: '1.5', color: '#111' }}>
            <p><strong>Output File:</strong> <span style={{color: '#111'}}>{form.outputFileName || 'Not specified'}</span></p>
            <p><strong>Target Folder:</strong> <span style={{color: '#111'}}>{form.targetFolderId || 'Not specified'}</span></p>
            <p><strong>Account Manager:</strong> <span style={{color: '#111'}}>{form.accountManager || 'Not selected'}</span></p>
            <p><strong>Client:</strong> <span style={{color: '#111'}}>{form.flourishClientName || 'Not specified'}</span></p>
            <p><strong>App:</strong> <span style={{color: '#111'}}>{form.appName || 'Not specified'}</span></p>
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
