"use client";
import React, { useEffect, useState } from "react";
import styles from "../page.module.css";
import { useFormContext } from "../../context/FormContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ClearButton from "../../components/ClearButton";

export default function AddImages() {
  const { form, setField } = useFormContext();
  const [accountManagers, setAccountManagers] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin")
      .then(res => res.json())
      .then(data => setAccountManagers(data.accountManagers || []))
      .catch(() => setAccountManagers([]));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.centeredCard}>
        <h1 className={styles.title}>Add Images</h1>
        <form className={styles.form} autoComplete="off">
          <select
            className={styles.input}
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
          <input className={styles.input} type="text" placeholder="Placeholder Field 2" />
          <input className={styles.input} type="text" placeholder="Placeholder Field 3" />
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
