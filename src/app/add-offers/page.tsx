"use client";
import React, { useEffect, useState } from "react";
import styles from "../page.module.css";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useFormContext } from "../../context/FormContext";
import ClearButton from "../../components/ClearButton";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import ProgressBar from "../../components/ProgressBar";

interface Offer {
  id: string;
  geo: string;
  gender: string;
  minAge: string;
  maxAge: string;
  minOS: string;
  maxOS: string;
  cpi: string;
  cpiOverride: string;
  dailyBudget: string;
  dailyCap: string;
  clientOfferName: string;
}

interface OfferErrors {
  minAge?: string;
  maxAge?: string;
  minOS?: string;
  maxOS?: string;
  cpi?: string;
  cpiOverride?: string;
  clientOfferName?: string;
}

const initialOffer = (geo: string): Offer => ({
  id: `offer-${Date.now()}-${Math.random()}`,
  geo: geo || "",
  gender: "",
  minAge: "",
  maxAge: "",
  minOS: "",
  maxOS: "",
  cpi: "",
  cpiOverride: "",
  dailyBudget: "",
  dailyCap: "",
  clientOfferName: ""
});

export default function AddOffers() {
  const { form, setField } = useFormContext();
  const router = useRouter();
  const pathname = usePathname();
  const [geoOptions, setGeoOptions] = useState<string[]>([]);
  const [genderOptions, setGenderOptions] = useState<string[]>(["Male", "Female", "Any"]);
  const [errors, setErrors] = useState<OfferErrors[]>([]);

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

  // Fetch admin dropdowns
  useEffect(() => {
    fetch("/api/admin")
      .then(res => res.json())
      .then(data => {
        setGeoOptions(data.geoOptions || []);
        setGenderOptions(data.genderOptions || ["Male", "Female", "Any"]);
      })
      .catch(() => {
        setGeoOptions([]);
        setGenderOptions(["Male", "Female", "Any"]);
      });
  }, []);

  // Initialize offers if empty
  useEffect(() => {
    if (form.offers.length === 0) {
      setField('offers', [initialOffer(form.geo)]);
    }
  }, [form.offers.length, form.geo, setField]);

  // Propagate geo from previous page
  useEffect(() => {
    if (form.offers.length === 1 && !form.offers[0].geo && form.geo) {
      const updatedOffers = [{ ...form.offers[0], geo: form.geo }];
      setField('offers', updatedOffers);
    }
  }, [form.geo, form.offers, setField]);

  // Validation
  const validateRow = (row: Offer): OfferErrors => {
    const rowErrors: OfferErrors = {};
    // Min/Max Age
    if (row.minAge && row.maxAge && parseInt(row.minAge) >= parseInt(row.maxAge)) {
      rowErrors.minAge = "Check age";
      rowErrors.maxAge = "Check age";
    }
    // Min/Max OS
    if (row.minOS && row.maxOS && parseInt(row.minOS) >= parseInt(row.maxOS)) {
      rowErrors.minOS = "Check OS";
      rowErrors.maxOS = "Check OS";
    }
    // CPI
    if (row.cpi && (parseFloat(row.cpi) > 25)) {
      rowErrors.cpi = "Check values";
    }
    if (row.cpiOverride && (parseFloat(row.cpiOverride) > 25)) {
      rowErrors.cpiOverride = "Check values";
    }
    // Client Offer Name
    if (row.clientOfferName && /\s/.test(row.clientOfferName)) {
      rowErrors.clientOfferName = "No spaces allowed";
    }
    return rowErrors;
  };

  // Handle field change
  const handleChange = (idx: number, field: keyof Offer, value: string) => {
    const updated = form.offers.map((row, i) =>
      i === idx ? { ...row, [field]: value } : row
    );
    setField("offers", updated);
    // Validate
    const rowErrors = validateRow(updated[idx]);
    setErrors(errors.map((e, i) => (i === idx ? rowErrors : e)));
  };

  // Add row
  const handleAddRow = () => {
    const newOffers = [...form.offers, initialOffer(form.geo)];
    setField("offers", newOffers);
    setErrors([...errors, {}]);
  };

  // Delete row
  const handleDeleteRow = (idx: number) => {
    if (form.offers.length === 1) return;
    const newOffers = form.offers.filter((_, i) => i !== idx);
    setField("offers", newOffers);
    setErrors(errors.filter((_, i) => i !== idx));
  };

  // Drag and drop - Fixed sensor configuration
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 10 }
  }));
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = form.offers.findIndex(item => item.id === active.id);
      const newIndex = form.offers.findIndex(item => item.id === over.id);
      const reordered = arrayMove(form.offers, oldIndex, newIndex);
      setField("offers", reordered);
      setErrors(arrayMove(errors, oldIndex, newIndex));
    }
  };

  // Field widths
  const geoWidth = "75px";
  const genderWidth = "100px";
  const ageOsWidth = "70px";
  const cpiWidth = "80px";
  const cpiOverrideWidth = "90px";
  const dailyBudgetWidth = "90px";
  const dailyCapWidth = "90px";

  return (
    <div className={styles.page}>
      <ProgressBar steps={progressSteps} />
      <div className={styles.centeredCard}>
        <h1 className={styles.title}>Add Offers</h1>
        {/* Headers */}
        <div className={styles.eventsHeader}>
          <div className={styles.eventDragHandle}></div>
          <div className={styles.eventField} style={{ width: geoWidth }}>
            <div className={styles.eventColumnHeader}>Geo</div>
          </div>
          <div className={styles.eventField} style={{ width: genderWidth }}>
            <div className={styles.eventColumnHeader}>Gender</div>
          </div>
          <div className={styles.eventField} style={{ width: ageOsWidth }}>
            <div className={styles.eventColumnHeader}>Min Age</div>
          </div>
          <div className={styles.eventField} style={{ width: ageOsWidth }}>
            <div className={styles.eventColumnHeader}>Max Age</div>
          </div>
          <div className={styles.eventField} style={{ width: ageOsWidth }}>
            <div className={styles.eventColumnHeader}>Min OS</div>
          </div>
          <div className={styles.eventField} style={{ width: ageOsWidth }}>
            <div className={styles.eventColumnHeader}>Max OS</div>
          </div>
          <div className={styles.eventField} style={{ width: cpiWidth }}>
            <div className={styles.eventColumnHeader}>CPI</div>
          </div>
          <div className={styles.eventField} style={{ width: cpiOverrideWidth }}>
            <div className={styles.eventColumnHeader}>CPI Override</div>
          </div>
          <div className={styles.eventField} style={{ width: dailyBudgetWidth }}>
            <div className={styles.eventColumnHeader}>Daily Budget</div>
          </div>
          <div className={styles.eventField} style={{ width: dailyCapWidth }}>
            <div className={styles.eventColumnHeader}>Daily Cap</div>
          </div>
          <div className={styles.eventField} style={{ flex: 1, minWidth: 120 }}>
            <div className={styles.eventColumnHeader}>Client Offer Name</div>
          </div>
          <div style={{ width: 40 }}></div>
        </div>
        {/* Rows */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={form.offers.map(row => row.id)} strategy={verticalListSortingStrategy}>
            {form.offers.map((row, idx) => (
              <div key={row.id} className={styles.eventRow}>
                <div className={styles.eventDragHandle} {...(form.offers.length > 1 ? { tabIndex: 0 } : {})}>≡</div>
                {/* Geo */}
                <div className={styles.eventField} style={{ width: geoWidth }}>
                  <select
                    className={styles.eventFieldInput}
                    value={row.geo}
                    onChange={e => handleChange(idx, "geo", e.target.value)}
                  >
                    <option value="" disabled>Geo</option>
                    {geoOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                {/* Gender */}
                <div className={styles.eventField} style={{ width: genderWidth }}>
                  <select
                    className={styles.eventFieldInput}
                    value={row.gender}
                    onChange={e => handleChange(idx, "gender", e.target.value)}
                  >
                    <option value="" disabled>Gender</option>
                    {genderOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                {/* Min Age */}
                <div className={styles.eventField} style={{ width: ageOsWidth }}>
                  <input
                    className={styles.eventFieldInput + (errors[idx]?.minAge ? ' ' + styles.errorInput : '')}
                    type="text"
                    value={row.minAge}
                    onChange={e => handleChange(idx, "minAge", e.target.value.replace(/[^\d]/g, ""))}
                    placeholder=""
                  />
                  {errors[idx]?.minAge && <div className={styles.errorText}>{errors[idx].minAge}</div>}
                </div>
                {/* Max Age */}
                <div className={styles.eventField} style={{ width: ageOsWidth }}>
                  <input
                    className={styles.eventFieldInput + (errors[idx]?.maxAge ? ' ' + styles.errorInput : '')}
                    type="text"
                    value={row.maxAge}
                    onChange={e => handleChange(idx, "maxAge", e.target.value.replace(/[^\d]/g, ""))}
                    placeholder=""
                  />
                  {errors[idx]?.maxAge && <div className={styles.errorText}>{errors[idx].maxAge}</div>}
                </div>
                {/* Min OS */}
                <div className={styles.eventField} style={{ width: ageOsWidth }}>
                  <input
                    className={styles.eventFieldInput + (errors[idx]?.minOS ? ' ' + styles.errorInput : '')}
                    type="text"
                    value={row.minOS}
                    onChange={e => handleChange(idx, "minOS", e.target.value.replace(/[^\d]/g, ""))}
                    placeholder=""
                  />
                  {errors[idx]?.minOS && <div className={styles.errorText}>{errors[idx].minOS}</div>}
                </div>
                {/* Max OS */}
                <div className={styles.eventField} style={{ width: ageOsWidth }}>
                  <input
                    className={styles.eventFieldInput + (errors[idx]?.maxOS ? ' ' + styles.errorInput : '')}
                    type="text"
                    value={row.maxOS}
                    onChange={e => handleChange(idx, "maxOS", e.target.value.replace(/[^\d]/g, ""))}
                    placeholder=""
                  />
                  {errors[idx]?.maxOS && <div className={styles.errorText}>{errors[idx].maxOS}</div>}
                </div>
                {/* CPI */}
                <div className={styles.eventField} style={{ width: cpiWidth }}>
                  <input
                    className={styles.eventFieldInput + (errors[idx]?.cpi ? ' ' + styles.errorInput : '')}
                    type="text"
                    value={row.cpi}
                    onChange={e => handleChange(idx, "cpi", e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1").replace(/^(\d*\.?\d{0,2}).*$/, "$1"))}
                    placeholder=""
                  />
                  {errors[idx]?.cpi && <div className={styles.errorText}>{errors[idx].cpi}</div>}
                </div>
                {/* CPI Override */}
                <div className={styles.eventField} style={{ width: cpiOverrideWidth }}>
                  <input
                    className={styles.eventFieldInput + (errors[idx]?.cpiOverride ? ' ' + styles.errorInput : '')}
                    type="text"
                    value={row.cpiOverride}
                    onChange={e => handleChange(idx, "cpiOverride", e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1").replace(/^(\d*\.?\d{0,2}).*$/, "$1"))}
                    placeholder=""
                  />
                  {errors[idx]?.cpiOverride && <div className={styles.errorText}>{errors[idx].cpiOverride}</div>}
                </div>
                {/* Daily Budget */}
                <div className={styles.eventField} style={{ width: dailyBudgetWidth }}>
                  <input
                    className={styles.eventFieldInput}
                    type="text"
                    value={row.dailyBudget}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d]/g, "");
                      const formatted = raw ? parseInt(raw, 10).toLocaleString() : "";
                      handleChange(idx, "dailyBudget", formatted);
                    }}
                    placeholder=""
                  />
                </div>
                {/* Daily Cap */}
                <div className={styles.eventField} style={{ width: dailyCapWidth }}>
                  <input
                    className={styles.eventFieldInput}
                    type="text"
                    value={row.dailyCap}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d]/g, "");
                      const formatted = raw ? parseInt(raw, 10).toLocaleString() : "";
                      handleChange(idx, "dailyCap", formatted);
                    }}
                    placeholder=""
                  />
                </div>
                {/* Client Offer Name */}
                <div className={styles.eventField} style={{ flex: 1, minWidth: 120 }}>
                  <input
                    className={styles.eventFieldInput + (errors[idx]?.clientOfferName ? ' ' + styles.errorInput : '')}
                    type="text"
                    value={row.clientOfferName}
                    onChange={e => handleChange(idx, "clientOfferName", e.target.value.replace(/\s/g, ""))}
                    placeholder=""
                  />
                  {errors[idx]?.clientOfferName && <div className={styles.errorText}>{errors[idx].clientOfferName}</div>}
                </div>
                {/* Delete button */}
                <div style={{ width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className={styles.eventDeleteButton}
                    onClick={() => handleDeleteRow(idx)}
                    disabled={form.offers.length === 1}
                    aria-label="Delete row"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </SortableContext>
        </DndContext>
        {/* Add Row Button */}
        <div className={styles.addEventRowButtonContainer}>
          <button className={styles.addEventRowButton} onClick={handleAddRow} type="button">
            + Add Offer Row
          </button>
        </div>
        <div className={styles.navButtonGroup}>
          <button type="button" className={`${styles.navButton} ${styles.navButtonBack}`} onClick={() => router.back()}>Back</button>
          <Link href="/add-images" className={`${styles.navButton} ${styles.navButtonNext}`}>Next</Link>
        </div>
        <ClearButton />
      </div>
    </div>
  );
}
