"use client";
import React, { useEffect, useState } from "react";
import styles from "../page.module.css";
import { useFormContext } from "../../context/FormContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ClearButton from "../../components/ClearButton";

export default function AddAnApp() {
  const { form, setField } = useFormContext();
  const [accountManagers, setAccountManagers] = useState<string[]>([]);
  const [osOptions, setOsOptions] = useState<string[]>([]);
  const [category1Options, setCategory1Options] = useState<string[]>([]);
  const [category2Options, setCategory2Options] = useState<string[]>([]);
  const [category3Options, setCategory3Options] = useState<string[]>([]);
  const router = useRouter();

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
            <select
              className={styles.floatingInput}
              required
              value={form.os}
              onChange={e => setField("os", e.target.value)}
            >
              <option value="" disabled>
                OS*
              </option>
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
              placeholder="Google Play Store or Apple App Store URL"
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
              placeholder="Client's Retribution Window in Days"
            />
            <label className={styles.floatingLabel}>Retribution Window</label>
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
