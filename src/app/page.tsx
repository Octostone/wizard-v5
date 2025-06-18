"use client";
import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormContext } from "../context/FormContext";

export default function Home() {
  const [accountManagers, setAccountManagers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { form, setField } = useFormContext();

  useEffect(() => {
    const fetchAccountManagers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch("/api/admin");
        if (!res.ok) {
          throw new Error('Failed to fetch account managers');
        }
        const data = await res.json();
        setAccountManagers(data.accountManagers || []);
      } catch (err) {
        console.error('Error fetching account managers:', err);
        setError('Failed to load account managers. Please try refreshing the page.');
        setAccountManagers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccountManagers();
  }, []);

  // Helper function to extract folder ID from Google Drive URL
  const extractFolderId = (url: string): string => {
    const match = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url;
  };

  return (
    <div className={styles.page}>
      <div className={styles.centeredCard}>
        <h1 className={styles.title}>Flourish Wizard</h1>
        <form className={styles.form} autoComplete="off">
          <div className={styles.formGroup}>
            <select
              className={styles.floatingInput}
              required
              value={form.accountManager}
              onChange={e => setField("accountManager", e.target.value)}
              disabled={isLoading}
            >
              <option value="" disabled>
                {isLoading ? 'Loading...' : 'Account Manager*'}
              </option>
              {accountManagers.map((manager) => (
                <option key={manager} value={manager}>{manager}</option>
              ))}
            </select>
            <label className={styles.floatingLabel}>Account Manager</label>
            {error && <div className={styles.error}>{error}</div>}
          </div>
          <div className={styles.formGroup}>
            <input
              className={styles.floatingInput}
              type="text"
              placeholder=" "
              value={form.outputFileName || ""}
              onChange={e => setField("outputFileName", e.target.value)}
              required
            />
            <label className={styles.floatingLabel}>Name your output Excel file (this will become the Google Sheet name)*</label>
          </div>
          <div className={styles.formGroup}>
            <input
              className={styles.floatingInput}
              type="text"
              placeholder=" "
              value={form.targetFolderId || ""}
              onChange={e => setField("targetFolderId", extractFolderId(e.target.value))}
              required
            />
            <label className={styles.floatingLabel}>Paste Google Drive folder URL to save the file*</label>
          </div>
        </form>
        <div className={styles.buttonGroup}>
          <button type="button" className={styles.actionButton} style={{ background: '#0d47a1' }} onClick={() => router.push('/client-basics')}>
            ADD NEW CLIENT, APP, CAMPAIGN AND OFFERS
          </button>
          <button type="button" className={styles.actionButton} onClick={() => router.push('/add-an-app')}>
            ADD AN APP, CAMPAIGN AND OFFERS
          </button>
          <button type="button" className={styles.actionButton} onClick={() => router.push('/add-campaign')}>
            ADD A CAMPAIGN AND OFFERS
          </button>
          <button type="button" className={styles.actionButton} onClick={() => router.push('/add-offers')}>
            ADD OFFERS TO AN EXISTING CAMPAIGN
          </button>
          <button type="button" className={styles.actionButton} onClick={() => router.push('/add-images')}>
            UPDATE IMAGES ONLY
          </button>
        </div>
      </div>
      <Link href="/admin" className={styles.adminButton}>
        ADMIN ACCESS
      </Link>
    </div>
  );
}
