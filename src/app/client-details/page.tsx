"use client";
import React, { useState } from "react";
import styles from "../page.module.css";
import Link from "next/link";
import { useFormContext } from "../../context/FormContext";
import { useRouter } from "next/navigation";
import ClearButton from "../../components/ClearButton";

export default function ClientDetails() {
  const { form, setField } = useFormContext();
  const router = useRouter();
  const [flourishError, setFlourishError] = useState("");
  const [grossDeductionError, setGrossDeductionError] = useState("");

  // Helper to remove line breaks
  const stripLineBreaks = (value: string) => value.replace(/[\r\n]+/g, " ");

  // Validation for Flourish Client Name
  const validateFlourish = (value: string) => {
    if (/\s/.test(value)) return "No spaces allowed.";
    if (/[^a-z0-9_]/.test(value)) return "Only lowercase letters, numbers, and underscores allowed.";
    if (!value.endsWith("_flourish")) return 'Must end with "_flourish".';
    return "";
  };

  const handleFlourishBlur = () => {
    setFlourishError(validateFlourish(form.flourishClientName));
  };

  const handleFlourishChange = (val: string) => {
    const clean = stripLineBreaks(val);
    setField("flourishClientName", clean);
    if (flourishError) setFlourishError(validateFlourish(clean));
  };

  const handleGrossDeductionChange = (val: string) => {
    // Only allow numeric, no decimals
    const clean = stripLineBreaks(val).replace(/[^0-9]/g, "");
    setField("grossDeduction", clean);
  };

  const handleGrossDeductionFocus = () => {
    if (form.netGross !== "gross") {
      setGrossDeductionError("Value not needed");
      setTimeout(() => setGrossDeductionError("") , 2000);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.centeredCard}>
        <h1 className={styles.title}>Client Details</h1>
        <form className={styles.form} autoComplete="off">
          {/* Flourish Client Name */}
          <div className={styles.formGroup}>
            <input
              className={styles.floatingInput}
              type="text"
              required
              value={form.flourishClientName}
              onChange={e => handleFlourishChange(e.target.value)}
              onBlur={handleFlourishBlur}
              placeholder=" "
              style={flourishError ? { borderColor: 'red' } : {}}
            />
            <label className={styles.floatingLabel}>Flourish Client Name</label>
            {flourishError && <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>{flourishError}</div>}
          </div>
          {/* MMP used by client */}
          <div className={styles.formGroup}>
            <select
              className={styles.floatingInput}
              required
              value={form.mmp}
              onChange={e => setField("mmp", e.target.value)}
            >
              <option value="" disabled>MMP used by client</option>
              <option value="Adjust">Adjust</option>
              <option value="Appsflyer">Appsflyer</option>
            </select>
            <label className={styles.floatingLabel}>MMP</label>
          </div>
          {/* Net/Gross */}
          <div className={styles.formGroup}>
            <select
              className={styles.floatingInput}
              required
              value={form.netGross}
              onChange={e => setField("netGross", e.target.value)}
            >
              <option value="" disabled>Is client passing us net or gross values on IAP's?</option>
              <option value="net">net</option>
              <option value="gross">gross</option>
            </select>
            <label className={styles.floatingLabel}>Net/Gross</label>
          </div>
          {/* Gross Deduction */}
          <div className={styles.formGroup}>
            <input
              className={styles.floatingInput}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.grossDeduction}
              onChange={e => handleGrossDeductionChange(e.target.value)}
              placeholder={form.netGross === "gross" ? "If Gross, enter value" : "If Net, no value"}
              required={form.netGross === "gross"}
              disabled={form.netGross !== "gross"}
              onFocus={handleGrossDeductionFocus}
            />
            <label className={styles.floatingLabel}>% deducted</label>
            {grossDeductionError && <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>{grossDeductionError}</div>}
          </div>
          {/* Base/CM */}
          <div className={styles.formGroup}>
            <select
              className={styles.floatingInput}
              required
              value={form.baseCM}
              onChange={e => setField("baseCM", e.target.value)}
            >
              <option value="" disabled>Is client passing base or CM values?</option>
              <option value="base">base</option>
              <option value="CM">CM</option>
            </select>
            <label className={styles.floatingLabel}>Base/CM</label>
          </div>
        </form>
        <div className={styles.navButtonGroup}>
          <button type="button" className={`${styles.navButton} ${styles.navButtonBack}`} onClick={() => router.back()}>Back</button>
          <Link href="/add-an-app" className={`${styles.navButton} ${styles.navButtonNext}`}>Next</Link>
        </div>
        <ClearButton />
      </div>
    </div>
  );
}
