"use client";
import React, { useEffect, useState, useRef } from "react";
import styles from "../page.module.css";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useFormContext, FormState } from "../../context/FormContext";
import ClearButton from "../../components/ClearButton";
import ProgressBar from "../../components/ProgressBar";

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
  const [errors, setErrors] = useState<{ flourishClientName?: string; dailyBudget?: string; clientCampaignName?: string; roas?: { [key: string]: string } }>({});
  const [clickUrl, setClickUrl] = useState(form.clickUrl || "");
  const clickUrlRef = useRef<HTMLTextAreaElement>(null);

  const progressSteps = [
    { name: 'Home', path: '/' },
    { name: 'Client Basics', path: '/client-basics' },
    { name: 'Client Details', path: '/client-details' },
    { name: 'Add an App', path: '/add-an-app' },
    { name: 'Add Events', path: '/add-events' },
    { name: 'Add Campaign', path: '/add-campaign' },
    { name: 'Add Offers', path: '/add-offers' },
    { name: 'Add Images', path: '/add-images' },
    { name: 'Finish', path: '/finish' },
  ];

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

  // Format number with commas
  const formatNumber = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue === '') return '';
    return parseInt(numericValue).toLocaleString();
  };

  // Handle budget changes
  const handleBudgetChange = (field: "monthlyBudget" | "dailyBudget", value: string) => {
    const formattedValue = formatNumber(value);
    setField(field, formattedValue);
    
    // Validate daily budget
    if (field === "dailyBudget") {
      const monthlyBudget = parseInt(form.monthlyBudget?.replace(/[^0-9]/g, '') || '0');
      const dailyBudget = parseInt(value.replace(/[^0-9]/g, '') || '0');
      
      if (monthlyBudget > 0 && dailyBudget > 0 && dailyBudget * 30 > monthlyBudget) {
        setErrors(prev => ({ ...prev, dailyBudget: "Daily budget × 30 cannot exceed monthly budget" }));
      } else {
        setErrors(prev => ({ ...prev, dailyBudget: undefined }));
      }
    }
  };

  // Handle client campaign name with validation
  const handleClientCampaignName = (value: string) => {
    setField("clientCampaignName", value);
    
    // Check for spaces
    if (/\s/.test(value)) {
      setErrors(prev => ({ ...prev, clientCampaignName: "No spaces allowed" }));
    }
    // Check for line breaks
    else if (/[\r\n]/.test(value)) {
      setErrors(prev => ({ ...prev, clientCampaignName: "No line breaks allowed" }));
    }
    else {
      setErrors(prev => ({ ...prev, clientCampaignName: undefined }));
    }
  };

  // Handle ROAS changes with validation
  const handleRoasChange = (field: "D7" | "D14" | "D30" | "D60" | "D90" | "D180", value: string) => {
    // Only allow numeric values with up to one decimal point
    const numericValue = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1').replace(/^(\d*\.?\d{0,1}).*$/, '$1');
    setField(field, numericValue);
    
    // Validate ROAS progression
    validateRoasProgression();
  };

  // Validate ROAS progression
  const validateRoasProgression = () => {
    const roasFields: ("D7" | "D14" | "D30" | "D60" | "D90" | "D180")[] = ['D7', 'D14', 'D30', 'D60', 'D90', 'D180'];
    const roasErrors: { [key: string]: string } = {};
    
    for (let i = 1; i < roasFields.length; i++) {
      const currentField = roasFields[i];
      const previousField = roasFields[i - 1];
      
      const currentValue = parseFloat(form[currentField] || '0');
      const previousValue = parseFloat(form[previousField] || '0');
      
      if (currentValue > 0 && previousValue > 0 && currentValue < previousValue) {
        roasErrors[currentField] = `Value must be equal to or greater than ${previousField} (${previousValue})`;
      }
    }
    
    setErrors(prev => ({ ...prev, roas: roasErrors }));
  };

  // Validation for Flourish Client Name
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
      <ProgressBar steps={progressSteps} />
      <div className={styles.centeredCardNarrow}>
        <h1 className={styles.title}>Add Campaign</h1>
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
              <option value="" disabled>Geo for Campaign</option>
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
              style={errors.clientCampaignName ? { borderColor: 'red' } : {}}
            />
            <label className={styles.floatingLabel}>Client Campaign Name</label>
            {errors.clientCampaignName && <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>{errors.clientCampaignName}</div>}
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

          {/* Offer Type (formerly Pricing Model) */}
          <div className={styles.formGroup}>
            <select
              className={styles.floatingInput}
              value={form.pricingModel || ""}
              onChange={e => setField("pricingModel", e.target.value)}
              required
            >
              <option value="" disabled>Select Type</option>
              {pricingModels.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <label className={styles.floatingLabel}>Offer Type</label>
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
            {(['D7', 'D14', 'D30', 'D60', 'D90', 'D180'] as const).map((field) => (
              <div className={styles.formGroup} key={field}>
                <input
                  className={styles.floatingInput}
                  type="text"
                  value={typeof form[field] === 'string' ? form[field] : ''}
                  onChange={e => handleRoasChange(field, e.target.value)}
                  placeholder=" "
                  inputMode="numeric"
                  style={errors.roas?.[field] ? { borderColor: 'red' } : {}}
                />
                <label className={styles.floatingLabel}>{field}</label>
                {errors.roas?.[field] && <div style={{ color: 'red', fontSize: 11, marginTop: 2 }}>{errors.roas[field]}</div>}
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
