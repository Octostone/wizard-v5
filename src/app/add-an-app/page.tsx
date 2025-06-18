"use client";
import React, { useEffect, useState } from "react";
import styles from "../page.module.css";
import { useFormContext } from "../../context/FormContext";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import ClearButton from "../../components/ClearButton";

export default function AddAnApp() {
  const { form, setField } = useFormContext();
  const [accountManagers, setAccountManagers] = useState<string[]>([]);
  const [osOptions, setOsOptions] = useState<string[]>([]);
  const [category1Options, setCategory1Options] = useState<string[]>([]);
  const [category2Options, setCategory2Options] = useState<string[]>([]);
  const [category3Options, setCategory3Options] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/admin")
      .then(res => res.json())
      .then(data => {
        setAccountManagers(data.accountManagers || []);
        setOsOptions(data.osOptions || []);
        setCategory1Options(data.category1Options || ["Cat", "Dog", "Bird"]);
        setCategory2Options(data.category2Options || ["Cat", "Dog", "Bird"]);
        setCategory3Options(data.category3Options || ["Cat", "Dog", "Bird"]);
      })
      .catch(() => {
        setAccountManagers([]);
        setOsOptions([]);
        setCategory1Options(["Cat", "Dog", "Bird"]);
        setCategory2Options(["Cat", "Dog", "Bird"]);
        setCategory3Options(["Cat", "Dog", "Bird"]);
      });
  }, []);

  // Prevent line breaks in input fields
  const preventLineBreaks = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  // Only allow numbers for retribution days field
  const handleRetributionDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setField("retributionDays", value);
  };

  return (
    <div className={styles.page}>
      <div className={styles.centeredCard}>
        <h1 className={styles.title}>Add an App</h1>
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
        <form className={styles.form} autoComplete="off">
          <div className={styles.formGroup}>
            <select
              className={styles.floatingInput}
              required
              value={form.accountManager}
              onChange={e => setField("accountManager", e.target.value)}
            >
              <option value="" disabled>
                Account Manager*
              </option>
              {accountManagers.map((manager) => (
                <option key={manager} value={manager}>{manager}</option>
              ))}
            </select>
            <label className={styles.floatingLabel}>Account Manager</label>
          </div>

          <div className={styles.formGroup}>
            <input
              className={styles.floatingInput}
              type="text"
              required
              value={form.flourishClientName}
              onChange={e => setField("flourishClientName", e.target.value)}
              onKeyDown={preventLineBreaks}
            />
            <label className={styles.floatingLabel}>Flourish Client Name*</label>
          </div>

          <div className={styles.formGroup}>
            <input
              className={styles.floatingInput}
              type="text"
              required
              value={form.appName}
              onChange={e => setField("appName", e.target.value)}
              onKeyDown={preventLineBreaks}
              placeholder="This will be the common name used in Flourish"
            />
            <label className={styles.floatingLabel}>App Name*</label>
          </div>

          <div className={styles.formGroup}>
            <select
              className={styles.floatingInput}
              required
              value={form.os}
              onChange={e => setField("os", e.target.value)}
            >
              <option value="" disabled>OS</option>
              {osOptions.map((os) => (
                <option key={os} value={os}>{os}</option>
              ))}
            </select>
            <label className={styles.floatingLabel}>OS</label>
          </div>

          <div className={styles.formGroup}>
            <input
              className={styles.floatingInput}
              type="text"
              value={form.storeUrl}
              onChange={e => setField("storeUrl", e.target.value)}
              onKeyDown={preventLineBreaks}
            />
            <label className={styles.floatingLabel}>Store URL</label>
          </div>

          <div className={styles.formGroup}>
            <input
              className={styles.floatingInput}
              type="text"
              value={form.retributionDays}
              onChange={handleRetributionDaysChange}
              onKeyDown={preventLineBreaks}
            />
            <label className={styles.floatingLabel}>Retribution Window (Days)</label>
          </div>

          <div className={styles.formGroup}>
            <select
              className={styles.floatingInput}
              value={form.category1}
              onChange={e => setField("category1", e.target.value)}
            >
              <option value="" disabled>
                Category 1
              </option>
              {category1Options.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <label className={styles.floatingLabel}>Category 1</label>
          </div>

          <div className={styles.formGroup}>
            <select
              className={styles.floatingInput}
              value={form.category2}
              onChange={e => setField("category2", e.target.value)}
            >
              <option value="" disabled>
                Category 2
              </option>
              {category2Options.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <label className={styles.floatingLabel}>Category 2</label>
          </div>

          <div className={styles.formGroup}>
            <select
              className={styles.floatingInput}
              value={form.category3}
              onChange={e => setField("category3", e.target.value)}
            >
              <option value="" disabled>
                Category 3
              </option>
              {category3Options.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <label className={styles.floatingLabel}>Category 3</label>
          </div>
        </form>
        <div className={styles.navButtonGroup}>
          <button type="button" className={`${styles.navButton} ${styles.navButtonBack}`} onClick={() => router.back()}>Back</button>
          <Link href="/add-events" className={`${styles.navButton} ${styles.navButtonNext}`}>Next</Link>
        </div>
        <ClearButton />
      </div>
    </div>
  );
}
