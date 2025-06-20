"use client";
import React, { useEffect, useState, useRef } from "react";
import styles from "../page.module.css";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useFormContext } from "../../context/FormContext";
import ClearButton from "../../components/ClearButton";

interface AccountManager {
  name: string;
  email: string;
}

export default function AddCampaign() {
  const { form, setField } = useFormContext();
  const [accountManagers, setAccountManagers] = useState<AccountManager[]>([]);
  const [geoOptions, setGeoOptions] = useState<string[]>([]);
  const [pricingModels, setPricingModels] = useState<string[]>(["CPI", "Hybrid", "CPA"]);
  const [carouselSpotlightOptions, setCarouselSpotlightOptions] = useState<string[]>(["Carousel", "Spotlight"]);
  const router = useRouter();
  const pathname = usePathname();
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [clickUrl, setClickUrl] = useState(form.clickUrl || "");
  const clickUrlRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/admin")
      .then(res => res.json())
      .then(data => {
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
        setGeoOptions(data.geoOptions || []);
        setPricingModels(data.pricingModelOptions || ["CPI", "Hybrid", "CPA"]);
        setCarouselSpotlightOptions(data.carouselSpotlightOptions || ["Carousel", "Spotlight"]);
      })
      .catch(() => {
        setAccountManagers([]);
        setGeoOptions([]);
        setPricingModels(["CPI", "Hybrid", "CPA"]);
        setCarouselSpotlightOptions(["Carousel", "Spotlight"]);
      });
  }, []);

  // Auto-expand click URL textarea
  useEffect(() => {
    if (clickUrlRef.current) {
      clickUrlRef.current.style.height = "auto";
      clickUrlRef.current.style.height = clickUrlRef.current.scrollHeight + "px";
    }
  }, [clickUrl]);

  // Validation helpers
  const formatNumber = (value: string) => {
    if (!value) return "";
    const num = parseInt(value.replace(/,/g, ""));
    if (isNaN(num)) return "";
    return num.toLocaleString();
  };

  const handleBudgetChange = (field: "monthlyBudget" | "dailyBudget", value: string) => {
    // Only allow numbers and commas
    let clean = value.replace(/[^0-9]/g, "");
    clean = formatNumber(clean);
    setField(field, clean);
  };

  const handleClientCampaignName = (value: string) => {
    // Remove spaces automatically
    setField("clientCampaignName", value.replace(/\s/g, ""));
  };

  const handleRoasChange = (field: keyof typeof form, value: string) => {
    setField(field, value.replace(/[^0-9]/g, ""));
  };

  // Validation for daily < monthly
  useEffect(() => {
    if (form.dailyBudget && form.monthlyBudget) {
      const daily = parseInt(form.dailyBudget.replace(/,/g, ""));
      const monthly = parseInt(form.monthlyBudget.replace(/,/g, ""));
      if (daily >= monthly) {
        setErrors((e) => ({ ...e, dailyBudget: "Daily budget must be less than monthly budget." }));
      } else {
        setErrors((e) => ({ ...e, dailyBudget: undefined }));
      }
    }
  }, [form.dailyBudget, form.monthlyBudget]);

  // Flourish client name validation (reuse from other pages)
  const validateFlourish = (value: string) => {
    if (/\s/.test(value)) return "No spaces allowed.";
    if (/[^a-z0-9_]/.test(value)) return "Only lowercase letters, numbers, and underscores allowed.";
    if (!value.endsWith("_flourish")) return 'Must end with "_flourish".';
    return "";
  };

  // Helper to remove line breaks
  const stripLineBreaks = (value: string) => value.replace(/[\r\n]+/g, " ");

  return (
    <div className={styles.page}>
      <div className={styles.centeredCard}>
        <h1 className={styles.title}>Add Campaign</h1>
        {/* Progress Bar */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 40, gap: 8 }}>
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
              {idx < arr.length - 1 && <span style={{ color: '#888', margin: '0 4px', display: 'flex', alignItems: 'center' }}>→</span>}
            </React.Fragment>
          ))}
        </div>
        <form className={styles.form} autoComplete="off">
          {/* Account Manager */}
          <div className={styles.formGroup}>
            <select
              className={styles.floatingInput}
              required
              value={form.accountManager}
              onChange={e => setField("accountManager", e.target.value)}
            >
              <option value="" disabled>Account Manager*</option>
              {accountManagers.map((manager) => (
                <option key={manager.name} value={manager.name}>{manager.name}</option>
              ))}
            </select>
            <label className={styles.floatingLabel}>Account Manager</label>
          </div>

          {/* Flourish Client Name */}
          <div className={styles.formGroup}>
            <input
              className={styles.floatingInput}
              type="text"
              required
              value={form.flourishClientName}
              onChange={e => setField("flourishClientName", e.target.value)}
              onBlur={e => setErrors((err) => ({ ...err, flourishClientName: validateFlourish(e.target.value) }))}
              placeholder=" "
            />
            <label className={styles.floatingLabel}>Flourish Client Name</label>
            {errors.flourishClientName && <div style={{ color: 'red', fontSize: 13 }}>{errors.flourishClientName}</div>}
          </div>

          {/* App Name - inherits from previous page */}
          <div className={styles.formGroup}>
            <input
              className={styles.floatingInput}
              type="text"
              value={form.appName || ""}
              onChange={e => setField("appName", e.target.value)}
              placeholder=" "
            />
            <label className={styles.floatingLabel}>App Name</label>
          </div>

          {/* Geo for Campaign */}
          <div className={styles.formGroup}>
            <select
              className={styles.floatingInput}
              value={form.geo}
              onChange={e => setField("geo", e.target.value)}
              required
            >
              <option value="" disabled>Geo for Campaign*</option>
              {geoOptions.map((geo) => (
                <option key={geo} value={geo}>{geo}</option>
              ))}
            </select>
            <label className={styles.floatingLabel}>Geo for Campaign</label>
          </div>

          {/* Client Campaign Name */}
          <div className={styles.formGroup}>
            <input
              className={styles.floatingInput}
              type="text"
              value={form.clientCampaignName || ""}
              onChange={e => handleClientCampaignName(e.target.value)}
              placeholder=" "
            />
            <label className={styles.floatingLabel}>Client Campaign Name</label>
          </div>

          {/* Monthly Budget */}
          <div className={styles.formGroup}>
            <input
              className={styles.floatingInput}
              type="text"
              value={form.monthlyBudget || ""}
              onChange={e => handleBudgetChange("monthlyBudget", e.target.value)}
              placeholder=" "
              inputMode="numeric"
            />
            <label className={styles.floatingLabel}>Monthly Budget</label>
          </div>

          {/* Daily Budget */}
          <div className={styles.formGroup}>
            <input
              className={styles.floatingInput}
              type="text"
              value={form.dailyBudget || ""}
              onChange={e => handleBudgetChange("dailyBudget", e.target.value)}
              placeholder=" "
              inputMode="numeric"
            />
            <label className={styles.floatingLabel}>Daily Budget</label>
            {errors.dailyBudget && <div style={{ color: 'red', fontSize: 13 }}>{errors.dailyBudget}</div>}
          </div>

          {/* Pricing Model */}
          <div className={styles.formGroup}>
            <select
              className={styles.floatingInput}
              value={form.pricingModel || ""}
              onChange={e => setField("pricingModel", e.target.value)}
              required
            >
              <option value="" disabled>Pricing Model</option>
              {pricingModels.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <label className={styles.floatingLabel}>Pricing Model</label>
          </div>

          {/* Carousel/Spotlight */}
          <div className={styles.formGroup}>
            <select
              className={styles.floatingInput}
              value={form.carouselSpotlight || ""}
              onChange={e => setField("carouselSpotlight", e.target.value)}
              required
            >
              <option value="" disabled>Carousel/Spotlight</option>
              {carouselSpotlightOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <label className={styles.floatingLabel}>Carousel/Spotlight</label>
          </div>

          {/* Click URL */}
          <div className={styles.formGroup}>
            <textarea
              className={styles.floatingInput}
              ref={clickUrlRef}
              value={clickUrl}
              onChange={e => { setClickUrl(e.target.value); setField("clickUrl", e.target.value); }}
              placeholder=" "
              style={{ resize: "none", minHeight: 40, maxHeight: 200, width: "100%" }}
            />
            <label className={styles.floatingLabel}>Click URL</label>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
              If non-standard click URLs with hardcoded elements are required, please submit separately with specific matching to the appropriate offers.
            </div>
          </div>

          {/* Enable Spiral Checkbox */}
          <div className={styles.roasSpiralCheckbox} style={{ justifyContent: 'center', color: '#111', fontWeight: 500, fontSize: '1rem' }}>
            <input
              type="checkbox"
              checked={form.enableSpiral || false}
              onChange={e => setField("enableSpiral", e.target.checked)}
              style={{ marginRight: 8 }}
            />
            Enable Spiral
          </div>
        </form>

        {/* ROAS Container */}
        <div className={styles.roasContainer}>
          <h2 className={styles.title} style={{ fontSize: 22, marginBottom: 12 }}>ROAS Targets</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {(['D7', 'D14', 'D30', 'D60', 'D90', 'D180'] as (keyof typeof form)[]).map((field) => (
              <div className={styles.formGroup} key={field}>
                <input
                  className={styles.floatingInput}
                  type="text"
                  value={typeof form[field] === 'string' ? form[field] : ''}
                  onChange={e => handleRoasChange(field, e.target.value)}
                  placeholder=" "
                  inputMode="numeric"
                />
                <label className={styles.floatingLabel}>{field}</label>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.navButtonGroup}>
          <button type="button" className={`${styles.navButton} ${styles.navButtonBack}`} onClick={() => router.back()}>Back</button>
          <Link href="/add-offers" className={`${styles.navButton} ${styles.navButtonNext}`}>Next</Link>
        </div>
        <ClearButton />
      </div>
    </div>
  );
}
