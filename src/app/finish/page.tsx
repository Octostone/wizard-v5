"use client";
import React, { useState, useEffect } from "react";
import styles from "../page.module.css";
import { useFormContext } from "../../context/FormContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import ClearButton from "../../components/ClearButton";
import ProgressBar from "../../components/ProgressBar";

export default function Finish() {
  const { form, resetForm } = useFormContext();
  const router = useRouter();
  const pathname = usePathname();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'processing'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<{ fileId: string; fileUrl: string } | null>(null);
  const [countdown, setCountdown] = useState(10);

  const progressSteps = [
    { name: 'Home', path: '/' },
    { name: 'Client Basics', path: '/client-basics' },
    { name: 'Client Details', path: '/client-details' },
    { name: 'Add an App', path: '/add-an-app' },
    { name: 'Add Events', path: '/add-events' },
    { name: 'Add Campaign', path: '/add-campaign' },
    { name: 'Add Offers', path: '/add-offers' },
    { name: 'Add Images', path: '/add-images' },
    { name: 'Finish', path: '/finish' },
  ];

  // Handle countdown and redirect after success
  useEffect(() => {
    if (submitStatus === 'success') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Set up a separate timeout for the redirect
      const redirectTimer = setTimeout(() => {
        resetForm();
        router.push("/");
      }, 10000);

      return () => {
        clearInterval(timer);
        clearTimeout(redirectTimer);
      };
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
      // First, upload all files to Google Drive
      const uploadedFiles = [];
      
      // Upload icon files
      if (form.iconFiles && form.iconFiles.length > 0) {
        for (const file of form.iconFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('targetFolderId', form.targetFolderId);
          
          const uploadResponse = await fetch('/api/upload-file', {
            method: 'POST',
            body: formData,
          });
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            uploadedFiles.push({
              type: 'icon',
              name: file.name,
              webViewLink: uploadData.webViewLink,
              fileId: uploadData.fileId
            });
          } else {
            console.error('Failed to upload icon file:', file.name);
            uploadedFiles.push({
              type: 'icon',
              name: file.name,
              webViewLink: 'Upload failed',
              fileId: null
            });
          }
        }
      }
      
      // Upload fill files
      if (form.fillFiles && form.fillFiles.length > 0) {
        for (const file of form.fillFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('targetFolderId', form.targetFolderId);
          
          const uploadResponse = await fetch('/api/upload-file', {
            method: 'POST',
            body: formData,
          });
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            uploadedFiles.push({
              type: 'fill',
              name: file.name,
              webViewLink: uploadData.webViewLink,
              fileId: uploadData.fileId
            });
          } else {
            console.error('Failed to upload fill file:', file.name);
            uploadedFiles.push({
              type: 'fill',
              name: file.name,
              webViewLink: 'Upload failed',
              fileId: null
            });
          }
        }
      }

      // Now send the form data with uploaded file information
      const formDataToSend = {
        ...form,
        uploadedFiles: uploadedFiles
      };

      const response = await fetch('/api/google-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outputFileName: form.outputFileName,
          targetFolderId: form.targetFolderId,
          formData: formDataToSend
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitStatus('success');
        setSuccessData({
          fileId: data.fileId,
          fileUrl: data.fileUrl
        });
        setCountdown(10);
      } else {
        setSubmitStatus('error');
        const errorMsg = data.error || data.details || 'Failed to create Google Sheet. Please try again.';
        console.error('Google Sheets API Error:', data);
        setErrorMessage(errorMsg);
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

  // Processing/Please wait page
  if (isSubmitting) {
    return (
      <div className={styles.page}>
        <div className={styles.centeredCardNarrow}>
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
            <h1 style={{ marginBottom: '16px', color: '#333' }}>Creating Your Google Sheet</h1>
            <p style={{ fontSize: '18px', color: '#000', marginBottom: '24px' }}>
              Please wait while we create your Google Sheet and populate it with your data...
            </p>
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#e7f3ff', 
              borderRadius: '8px', 
              marginBottom: '24px' 
            }}>
              <p style={{ margin: '0', fontSize: '16px', color: '#0056b3' }}>
                This may take a few moments
              </p>
            </div>
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

  // Success page
  if (submitStatus === 'success' && successData) {
    return (
      <div className={styles.page}>
        <div className={styles.centeredCardNarrow}>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              backgroundColor: '#28a745',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '40px',
              color: 'white'
            }}>✓</div>
            <h1 style={{ marginBottom: '16px', color: '#333' }}>Google Sheet Created Successfully!</h1>
            <p style={{ fontSize: '18px', color: '#000', marginBottom: '24px' }}>
              Your Google Sheet has been created and all data has been written successfully.
            </p>
            
            {/* File Details */}
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px', 
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <h3 style={{ marginBottom: '16px', color: '#333' }}>File Details:</h3>
              <p style={{ marginBottom: '8px', fontSize: '16px', color: '#000' }}>
                <strong>File ID:</strong> {successData.fileId}
              </p>
              <a 
                href={successData.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  display: 'inline-block', 
                  marginTop: '8px', 
                  padding: '12px 24px', 
                  backgroundColor: '#007bff', 
                  color: 'white', 
                  textDecoration: 'none', 
                  borderRadius: '6px',
                  fontWeight: '600'
                }}
              >
                Open Google Sheet
              </a>
            </div>
            
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
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              Return Home Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <ProgressBar steps={progressSteps} />
      <div className={styles.centeredCardNarrow}>
        <h1 className={styles.title}>Finish</h1>
        
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
