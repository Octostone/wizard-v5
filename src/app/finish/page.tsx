"use client";
import React from "react";
import styles from "../page.module.css";
import { useFormContext } from "../../context/FormContext";
import { useRouter } from "next/navigation";

export default function Finish() {
  const { resetForm } = useFormContext();
  const router = useRouter();

  const handleFinish = () => {
    resetForm();
    router.push("/");
  };

  return (
    <div className={styles.page}>
      <div className={styles.centeredCard}>
        <h1 className={styles.title}>Finish</h1>
        <div className={styles.navButtonGroup}>
          <button type="button" className={`${styles.navButton} ${styles.navButtonBack}`} onClick={() => router.back()}>Back</button>
          <button type="button" className={`${styles.navButton} ${styles.navButtonNext}`} onClick={handleFinish}>Finish and Submit Form</button>
        </div>
      </div>
    </div>
  );
}
