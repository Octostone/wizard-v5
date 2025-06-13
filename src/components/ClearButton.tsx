"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { useFormContext } from '../context/FormContext';
import styles from '../app/page.module.css';

export default function ClearButton() {
  const router = useRouter();
  const { resetForm } = useFormContext();

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all data and return to the landing page?')) {
      resetForm();
      // Use router.replace for a hard navigation, and fallback to reload if needed
      try {
        router.replace ? router.replace('/') : router.push('/');
      } catch (e) {
        window.location.href = '/';
      }
    }
  };

  return (
    <div className={styles.clearButtonContainer}>
      <button 
        type="button"
        className={styles.clearButton}
        onClick={handleClear}
      >
        Clear Form and Return to Landing Page
      </button>
    </div>
  );
} 