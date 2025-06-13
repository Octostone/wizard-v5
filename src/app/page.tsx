"use client";
import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormContext } from "../context/FormContext";

export default function Home() {
  const [accountManagers, setAccountManagers] = useState<string[]>([]);
  const router = useRouter();
  const { form, setField } = useFormContext();

  useEffect(() => {
    fetch("/api/admin")
      .then(res => res.json())
      .then(data => setAccountManagers(data.accountManagers || []))
      .catch(() => setAccountManagers([]));
  }, []);

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
          <input
            className={styles.input}
            type="text"
            placeholder="Name your output Excel file (this will become the Google Sheet name)*"
            required
          />
          <input
            className={styles.input}
            type="text"
            placeholder="Paste Google Drive folder URL to save the file*"
            required
          />
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
