"use client";
import React, { useEffect, useState } from "react";
import styles from "../page.module.css";
import { useFormContext } from "../../context/FormContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ClearButton from "../../components/ClearButton";

export default function ClientBasics() {
  const { form, setField } = useFormContext();
  const [accountManagers, setAccountManagers] = useState<string[]>([]);
  const router = useRouter();

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
