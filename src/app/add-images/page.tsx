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

    // Store the file name in form context
    setField("iconImageName", file.name);
    // Generate a placeholder link for Google Drive folder
    setField("iconImageLink", "https://drive.google.com/drive/folders/[FOLDER_ID]");
    setIconError("");
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

    // Store the file name in form context
    setField("fillImageName", file.name);
    // Generate a placeholder link for Google Drive folder
    setField("fillImageLink", "https://drive.google.com/drive/folders/[FOLDER_ID]");
    setFillError("");
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
              style={{ padding: '8px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}
              onClick={() => iconInputRef.current?.click()}
            >
              Choose File
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
              style={{ padding: '8px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}
              onClick={() => fillInputRef.current?.click()}
            >
              Choose File
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
