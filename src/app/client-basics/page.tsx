"use client";
import React, { useEffect, useState } from "react";
import styles from "../page.module.css";
import { useFormContext } from "../../context/FormContext";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import ClearButton from "../../components/ClearButton";

export default function ClientBasics() {
  const { form, setField } = useFormContext();
  const [accountManagers, setAccountManagers] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/admin")
      .then(res => res.json())
      .then(data => setAccountManagers(data.accountManagers || []))
      .catch(() => setAccountManagers([]));
  }, []);

  // Helper to remove line breaks
  const stripLineBreaks = (value: string) => value.replace(/[\r\n]+/g, " ");

  return (
    <div className={styles.page}>
      <div className={styles.centeredCard}>
        <h1 className={styles.title}>Client Basics</h1>
        {/* Progress Bar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32, gap: 8 }}>
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
              {idx < arr.length - 1 && <span style={{ color: '#888', margin: '0 4px' }}>→</span>}
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
              value={form.clientDBAName}
              onChange={e => setField("clientDBAName", stripLineBreaks(e.target.value))}
              placeholder=" "
            />
            <label className={styles.floatingLabel}>Client DBA Name</label>
          </div>
          <div className={styles.formGroup}>
            <input
              className={styles.floatingInput}
              type="text"
              required
              value={form.billingName}
              onChange={e => setField("billingName", stripLineBreaks(e.target.value))}
              placeholder=" "
            />
            <label className={styles.floatingLabel}>Billing Name</label>
          </div>
        </form>
        <div className={styles.navButtonGroup}>
          <button type="button" className={`${styles.navButton} ${styles.navButtonBack}`} onClick={() => router.back()}>Back</button>
          <Link href="/client-details" className={`${styles.navButton} ${styles.navButtonNext}`}>Next</Link>
        </div>
        <ClearButton />
      </div>
    </div>
  );
}
