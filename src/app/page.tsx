"use client";
import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormContext } from "../context/FormContext";

interface AccountManager {
  name: string;
  email: string;
}

export default function Home() {
  const [accountManagers, setAccountManagers] = useState<AccountManager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { form, setField } = useFormContext();

  const fetchAccountManagers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/admin");
      const data = await response.json();
      
      // Handle both old string format and new object format
      if (data.accountManagers && data.accountManagers.length > 0) {
        if (typeof data.accountManagers[0] === 'string') {
          // Convert old string format to new object format
          setAccountManagers(data.accountManagers.map((name: string) => ({ name, email: '' })));
        } else {
          // Already in new object format
          setAccountManagers(data.accountManagers);
        }
      } else {
        setAccountManagers([]);
      }
    } catch (error) {
      console.error("Failed to fetch account managers:", error);
      setError('Failed to load account managers. Please try refreshing the page.');
      setAccountManagers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountManagers();
  }, []);

  // Helper function to extract folder ID from Google Drive URL
  const extractFolderId = (url: string): string => {
    const match = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url;
  };

  return (
    <div className={styles.page}>
      <div className={styles.centeredCardNarrow}>
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
                <option key={manager.name} value={manager.name}>{manager.name}</option>
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
