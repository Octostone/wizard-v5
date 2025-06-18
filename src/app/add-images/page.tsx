"use client";
import React, { useEffect, useState, useRef } from "react";
import styles from "../page.module.css";
import { useFormContext } from "../../context/FormContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ClearButton from "../../components/ClearButton";

const MAX_FILE_SIZE = 100 * 1024; // 100 kB
const ACCEPTED_TYPES = ["image/jpeg", "image/png"];

function formatDatePrefix(type: string) {
  const now = new Date();
  const date = now.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: '2-digit' });
  const time = now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time} ${type}`;
}

export default function AddImages() {
  const { form, setField } = useFormContext();
  const [geoOptions, setGeoOptions] = useState<string[]>([]);
  const [iconError, setIconError] = useState<string>("");
  const [fillError, setFillError] = useState<string>("");
  const router = useRouter();
  const iconInputRef = useRef<HTMLInputElement>(null);
  const fillInputRef = useRef<HTMLInputElement>(null);

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

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIconError("");
    const file = e.target.files?.[0];
    if (!file) return;
    const errors = validateFile(file);
    if (errors.length > 0) {
      setIconError(errors.join(". "));
      setField("iconImageName", "");
      setField("iconImageLink", "");
    } else {
      // Store the file name in form context
      setField("iconImageName", file.name);
      // Generate a placeholder link for Google Drive folder
      setField("iconImageLink", "https://drive.google.com/drive/folders/[FOLDER_ID]");
      setIconError("");
    }
  };

  const handleFillUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFillError("");
    const file = e.target.files?.[0];
    if (!file) return;
    const errors = validateFile(file);
    if (errors.length > 0) {
      setFillError(errors.join(". "));
      setField("fillImageName", "");
      setField("fillImageLink", "");
    } else {
      // Store the file name in form context
      setField("fillImageName", file.name);
      // Generate a placeholder link for Google Drive folder
      setField("fillImageLink", "https://drive.google.com/drive/folders/[FOLDER_ID]");
      setFillError("");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.centeredCard}>
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
            <input
              type="file"
              accept="image/jpeg,image/png"
              ref={iconInputRef}
              onChange={handleIconUpload}
              style={{ border: iconError ? '2px solid #b71c1c' : undefined, padding: 8, borderRadius: 4 }}
            />
            {iconError && <div className={styles.errorText}>{iconError}</div>}
            {form.iconImageName && (
              <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                File: {form.iconImageName}
              </div>
            )}
          </div>
          {/* Upload Fill Image (Rectangle) */}
          <div className={styles.formGroup}>
            <label className={styles.floatingLabel} style={{ top: 0, left: 0, fontSize: '1rem', position: 'static', marginBottom: 4 }}>Upload Fill Image (Rectangle)</label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              ref={fillInputRef}
              onChange={handleFillUpload}
              style={{ border: fillError ? '2px solid #b71c1c' : undefined, padding: 8, borderRadius: 4 }}
            />
            {fillError && <div className={styles.errorText}>{fillError}</div>}
            {form.fillImageName && (
              <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                File: {form.fillImageName}
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
