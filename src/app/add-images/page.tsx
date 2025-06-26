"use client";
import React, { useEffect, useState, useRef } from "react";
import styles from "../page.module.css";
import { useFormContext } from "../../context/FormContext";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import ClearButton from "../../components/ClearButton";
import ProgressBar from "../../components/ProgressBar";

const MAX_FILE_SIZE = 100 * 1024; // 100 kB
const ACCEPTED_TYPES = ["image/jpeg", "image/png"];
const ICON_DIMENSIONS = { width: 300, height: 300 };
const FILL_DIMENSIONS = { width: 291, height: 465 };

function formatDatePrefix(type: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}_${type}`;
}

// Function to check image dimensions
const checkImageDimensions = (file: File, expectedDimensions: { width: number; height: number }): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      const isValid = img.width === expectedDimensions.width && img.height === expectedDimensions.height;
      resolve(isValid);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    
    img.src = url;
  });
};

// Function to upload file to Google Drive
const uploadFileToDrive = async (file: File, targetFolderId: string): Promise<{ success: boolean; fileId?: string; webViewLink?: string; error?: string }> => {
  try {
    console.log('🔄 Starting file upload...');
    console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type);
    console.log('Target folder ID:', targetFolderId);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('targetFolderId', targetFolderId);

    const response = await fetch('/api/upload-file', {
      method: 'POST',
      body: formData,
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('📡 Response data:', data);

    if (response.ok && data.success) {
      console.log('✅ Upload successful');
      return {
        success: true,
        fileId: data.fileId,
        webViewLink: data.webViewLink,
      };
    } else {
      console.error('❌ Upload failed:', data);
      // Create a more detailed error message
      let errorMessage = data.error || 'Upload failed';
      if (data.details) {
        errorMessage += `: ${data.details}`;
      }
      if (data.code) {
        errorMessage += ` (Code: ${data.code})`;
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  } catch (error) {
    console.error('❌ Network error during upload:', error);
    return {
      success: false,
      error: 'Network error during upload',
    };
  }
};

export default function AddImages() {
  const { form, setField } = useFormContext();
  const [geoOptions, setGeoOptions] = useState<string[]>([]);
  const [iconError, setIconError] = useState<string>("");
  const [fillError, setFillError] = useState<string>("");
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [isUploadingFill, setIsUploadingFill] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const iconInputRef = useRef<HTMLInputElement>(null);
  const fillInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    fetch("/api/admin")
      .then(res => res.json())
      .then(data => {
        setGeoOptions(data.geoOptions || []);
      })
      .catch(() => {
        setGeoOptions([]);
      });
  }, []);

  // Pre-populate geo field
  useEffect(() => {
    if (geoOptions.length > 0) {
      if (!form.geo || !geoOptions.includes(form.geo)) {
        setField("geo", geoOptions[0]);
      }
    }
  }, [geoOptions]);

  // File validation
  const validateFile = (file: File) => {
    const errors: string[] = [];
    if (!ACCEPTED_TYPES.includes(file.type)) errors.push("Format not accepted");
    if (file.size > MAX_FILE_SIZE) errors.push("File too big");
    return errors;
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIconError("");
    const file = e.target.files?.[0];
    if (!file) return;
    
    const errors = validateFile(file);
    if (errors.length > 0) {
      setIconError(errors.join(". "));
      setField("iconImageName", "");
      setField("iconImageLink", "");
      return;
    }

    // Check dimensions
    const isValidDimensions = await checkImageDimensions(file, ICON_DIMENSIONS);
    if (!isValidDimensions) {
      setIconError(`Image must be exactly ${ICON_DIMENSIONS.width}x${ICON_DIMENSIONS.height} pixels`);
      setField("iconImageName", "");
      setField("iconImageLink", "");
      return;
    }

    // Check if target folder is set
    if (!form.targetFolderId) {
      setIconError("Please set the target folder on the home page first");
      setField("iconImageName", "");
      setField("iconImageLink", "");
      return;
    }

    // Upload file to Google Drive
    setIsUploadingIcon(true);
    const uploadResult = await uploadFileToDrive(file, form.targetFolderId);
    setIsUploadingIcon(false);

    if (uploadResult.success && uploadResult.webViewLink) {
      setField("iconImageName", file.name);
      setField("iconImageLink", uploadResult.webViewLink);
      setIconError("");
    } else {
      setIconError(uploadResult.error || "Upload failed");
      setField("iconImageName", "");
      setField("iconImageLink", "");
    }
  };

  const handleFillUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFillError("");
    const file = e.target.files?.[0];
    if (!file) return;
    
    const errors = validateFile(file);
    if (errors.length > 0) {
      setFillError(errors.join(". "));
      setField("fillImageName", "");
      setField("fillImageLink", "");
      return;
    }

    // Check dimensions
    const isValidDimensions = await checkImageDimensions(file, FILL_DIMENSIONS);
    if (!isValidDimensions) {
      setFillError(`Image must be exactly ${FILL_DIMENSIONS.width}x${FILL_DIMENSIONS.height} pixels`);
      setField("fillImageName", "");
      setField("fillImageLink", "");
      return;
    }

    // Check if target folder is set
    if (!form.targetFolderId) {
      setFillError("Please set the target folder on the home page first");
      setField("fillImageName", "");
      setField("fillImageLink", "");
      return;
    }

    // Upload file to Google Drive
    setIsUploadingFill(true);
    const uploadResult = await uploadFileToDrive(file, form.targetFolderId);
    setIsUploadingFill(false);

    if (uploadResult.success && uploadResult.webViewLink) {
      setField("fillImageName", file.name);
      setField("fillImageLink", uploadResult.webViewLink);
      setFillError("");
    } else {
      setFillError(uploadResult.error || "Upload failed");
      setField("fillImageName", "");
      setField("fillImageLink", "");
    }
  };

  return (
    <div className={styles.page}>
      <ProgressBar steps={progressSteps} />
      <div className={styles.centeredCardNarrow}>
        <h1 className={styles.title}>Add Images</h1>
        <form className={styles.form} autoComplete="off">
          {/* Flourish Client Name */}
          <div className={styles.formGroup}>
            <input
              className={styles.floatingInput}
              type="text"
              required
              value={form.flourishClientName || ""}
              onChange={e => setField("flourishClientName", e.target.value)}
              placeholder=" "
            />
            <label className={styles.floatingLabel}>Flourish Client Name</label>
          </div>
          {/* App Name */}
          <div className={styles.formGroup}>
            <input
              className={styles.floatingInput}
              type="text"
              value={form.appName || ""}
              onChange={e => setField("appName", e.target.value)}
              placeholder=" "
            />
            <label className={styles.floatingLabel}>App Name</label>
          </div>
          {/* Geo */}
          <div className={styles.formGroup}>
            <select
              className={styles.floatingInput}
              required
              value={form.geo || ""}
              onChange={e => setField("geo", e.target.value)}
            >
              <option value="" disabled>Select Geo to add images to*</option>
              {geoOptions.map((geo) => (
                <option key={geo} value={geo}>{geo}</option>
              ))}
            </select>
            <label className={styles.floatingLabel}>Select Geo to add images to</label>
          </div>
          {/* Upload Icon (Square) */}
          <div className={styles.formGroup}>
            <label className={styles.floatingLabel} style={{ top: 0, left: 0, fontSize: '1rem', position: 'static', marginBottom: 4 }}>Upload Icon (Square)</label>
            <button
              type="button"
              style={{ 
                padding: '8px 16px', 
                background: isUploadingIcon ? '#ccc' : '#1976d2', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 4, 
                cursor: isUploadingIcon ? 'not-allowed' : 'pointer', 
                fontWeight: 500 
              }}
              onClick={() => iconInputRef.current?.click()}
              disabled={isUploadingIcon}
            >
              {isUploadingIcon ? 'Uploading...' : 'Choose File'}
            </button>
            <input
              ref={iconInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleIconUpload}
            />
            <span style={{ color: '#111', fontWeight: 500, fontSize: 15, marginLeft: 8 }}>
              {form.iconImageName || 'No file chosen'}
            </span>
            {iconError && (
              <div style={{ color: '#d32f2f', fontSize: '0.875rem', marginTop: 4 }}>
                {iconError}
              </div>
            )}
          </div>
          {/* Upload Fill Image (Rectangle) */}
          <div className={styles.formGroup}>
            <label className={styles.floatingLabel} style={{ top: 0, left: 0, fontSize: '1rem', position: 'static', marginBottom: 4 }}>Upload Fill Image (Rectangle)</label>
            <button
              type="button"
              style={{ 
                padding: '8px 16px', 
                background: isUploadingFill ? '#ccc' : '#1976d2', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 4, 
                cursor: isUploadingFill ? 'not-allowed' : 'pointer', 
                fontWeight: 500 
              }}
              onClick={() => fillInputRef.current?.click()}
              disabled={isUploadingFill}
            >
              {isUploadingFill ? 'Uploading...' : 'Choose File'}
            </button>
            <input
              ref={fillInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFillUpload}
            />
            <span style={{ color: '#111', fontWeight: 500, fontSize: 15, marginLeft: 8 }}>
              {form.fillImageName || 'No file chosen'}
            </span>
            {fillError && (
              <div style={{ color: '#d32f2f', fontSize: '0.875rem', marginTop: 4 }}>
                {fillError}
              </div>
            )}
          </div>
        </form>
        <div className={styles.navButtonGroup}>
          <button type="button" className={`${styles.navButton} ${styles.navButtonBack}`} onClick={() => router.back()}>Back</button>
          <Link href="/finish" className={`${styles.navButton} ${styles.navButtonNext}`}>Next</Link>
        </div>
        <ClearButton />
      </div>
    </div>
  );
}
