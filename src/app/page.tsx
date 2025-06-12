import React from "react";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.centeredCard}>
        <h1 className={styles.title}>Flourish Wizard</h1>
        <form className={styles.form} autoComplete="off">
          <select className={styles.input} required defaultValue="">
            <option value="" disabled>
              Account Manager*
            </option>
            <option value="manager1">Manager 1</option>
            <option value="manager2">Manager 2</option>
            {/* Add more options as needed */}
          </select>
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
          <button className={styles.actionButton} style={{ background: '#0d47a1' }}>
            ADD NEW CLIENT, APP, CAMPAIGN AND OFFERS
          </button>
          <button className={styles.actionButton}>ADD AN APP, CAMPAIGN AND OFFERS</button>
          <button className={styles.actionButton}>ADD A CAMPAIGN AND OFFERS</button>
          <button className={styles.actionButton}>ADD OFFERS TO AN EXISTING CAMPAIGN</button>
          <button className={styles.actionButton}>UPDATE IMAGES ONLY</button>
        </div>
      </div>
      <button className={styles.adminButton}>ADMIN ACCESS</button>
    </div>
  );
}
