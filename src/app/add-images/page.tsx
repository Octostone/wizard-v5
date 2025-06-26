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

export default function AddImages() {
  const { form, setField } = useFormContext();
  const [geoOptions, setGeoOptions] = useState<string[]>([]);
  const [iconError, setIconError] = useState<string>("");
  const [fillError, setFillError] = useState<string>("");
  const [iconFiles, setIconFiles] = useState<File[]>([]);
  const [fillFiles, setFillFiles] = useState<File[]>([]);
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

  const handleIconFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIconError("");
    const file = e.target.files?.[0];
    if (!file) return;
    
    const errors = validateFile(file);
    if (errors.length > 0) {
      setIconError(errors.join(". "));
      return;
    }

    // Check dimensions
    const isValidDimensions = await checkImageDimensions(file, ICON_DIMENSIONS);
    if (!isValidDimensions) {
      setIconError(`Image must be exactly ${ICON_DIMENSIONS.width}x${ICON_DIMENSIONS.height} pixels`);
      return;
    }

    // Add file to the list
    setIconFiles(prev => [...prev, file]);
    setIconError("");
    
    // Clear the input so the same file can be selected again if needed
    if (iconInputRef.current) {
      iconInputRef.current.value = '';
    }
  };

  const handleFillFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFillError("");
    const file = e.target.files?.[0];
    if (!file) return;
    
    const errors = validateFile(file);
    if (errors.length > 0) {
      setFillError(errors.join(". "));
      return;
    }

    // Check dimensions
    const isValidDimensions = await checkImageDimensions(file, FILL_DIMENSIONS);
    if (!isValidDimensions) {
      setFillError(`Image must be exactly ${FILL_DIMENSIONS.width}x${FILL_DIMENSIONS.height} pixels`);
      return;
    }

    // Add file to the list
    setFillFiles(prev => [...prev, file]);
    setFillError("");
    
    // Clear the input so the same file can be selected again if needed
    if (fillInputRef.current) {
      fillInputRef.current.value = '';
    }
  };

  const removeIconFile = (index: number) => {
    setIconFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeFillFile = (index: number) => {
    setFillFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Update form context with file information for Google Sheets
  useEffect(() => {
    setField("iconFiles", iconFiles);
    setField("fillFiles", fillFiles);
    setField("iconImageNames", iconFiles.map(f => f.name).join(", "));
    setField("fillImageNames", fillFiles.map(f => f.name).join(", "));
  }, [iconFiles, fillFiles]);

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
                background: '#1976d2', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 4, 
                cursor: 'pointer', 
                fontWeight: 500 
              }}
              onClick={() => iconInputRef.current?.click()}
            >
              {iconFiles.length === 0 ? 'Choose File' : 'Add Another File'}
            </button>
            <input
              ref={iconInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleIconFileSelect}
            />
            {/* Display selected icon files */}
            {iconFiles.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: 4 }}>Selected files:</div>
                {iconFiles.map((file, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '4px 8px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 4,
                    marginBottom: 4
                  }}>
                    <span style={{ color: '#111', fontWeight: 500, fontSize: 14 }}>
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeIconFile(index)}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        cursor: 'pointer',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                background: '#1976d2', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 4, 
                cursor: 'pointer', 
                fontWeight: 500 
              }}
              onClick={() => fillInputRef.current?.click()}
            >
              {fillFiles.length === 0 ? 'Choose File' : 'Add Another File'}
            </button>
            <input
              ref={fillInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFillFileSelect}
            />
            {/* Display selected fill files */}
            {fillFiles.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: 4 }}>Selected files:</div>
                {fillFiles.map((file, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '4px 8px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 4,
                    marginBottom: 4
                  }}>
                    <span style={{ color: '#111', fontWeight: 500, fontSize: 14 }}>
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFillFile(index)}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        cursor: 'pointer',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
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
