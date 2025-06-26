"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type EventItem = {
  id: string;
  position: string;
  name: string; // event description
  postbackEventName: string;
  estCRPercent: string;
  estTTCMins: string;
  eventType: string;
  pubReveSource: string;
};

export type OfferItem = {
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
};

export type FormState = {
  accountManager: string;
  clientDBAName: string;
  billingName: string;
  flourishClientName: string;
  mmp: string;
  netGross: string;
  grossDeduction: string;
  baseCM: string;
  geo: string;
  os: string;
  storeUrl: string;
  retributionDays: string;
  category1: string;
  category2: string;
  category3: string;
  events: EventItem[];
  offers: OfferItem[];
  // Campaign fields
  appName?: string;
  clientCampaignName?: string;
  monthlyBudget?: string;
  dailyBudget?: string;
  pricingModel?: string;
  carouselSpotlight?: string;
  clickUrl?: string;
  enableSpiral?: boolean;
  D7?: string;
  D14?: string;
  D30?: string;
  D60?: string;
  D90?: string;
  D180?: string;
  // Image fields
  iconImageName?: string;
  iconImageLink?: string;
  fillImageName?: string;
  fillImageLink?: string;
  // Multiple file upload fields
  iconFiles?: File[];
  fillFiles?: File[];
  iconImageNames?: string;
  fillImageNames?: string;
  // Uploaded files information
  uploadedFiles?: Array<{
    type: 'icon' | 'fill';
    name: string;
    webViewLink: string;
    fileId: string | null;
  }>;
  // Submission fields
  outputFileName?: string;
  targetFolderId?: string;
};

const defaultState: FormState = {
  accountManager: "",
  clientDBAName: "",
  billingName: "",
  flourishClientName: "",
  mmp: "",
  netGross: "",
  grossDeduction: "",
  baseCM: "",
  geo: "",
  os: "",
  storeUrl: "",
  retributionDays: "",
  category1: "",
  category2: "",
  category3: "",
  events: [
    {
      id: "event-1",
      position: "1",
      name: "",
      postbackEventName: "",
      estCRPercent: "",
      estTTCMins: "",
      eventType: "",
      pubReveSource: ""
    }
  ],
  offers: [],
  // Campaign fields
  appName: "",
  clientCampaignName: "",
  monthlyBudget: "",
  dailyBudget: "",
  pricingModel: "",
  carouselSpotlight: "",
  clickUrl: "",
  enableSpiral: false,
  D7: "",
  D14: "",
  D30: "",
  D60: "",
  D90: "",
  D180: "",
  // Image fields
  iconImageName: "",
  iconImageLink: "",
  fillImageName: "",
  fillImageLink: "",
  // Multiple file upload fields
  iconFiles: [],
  fillFiles: [],
  iconImageNames: "",
  fillImageNames: "",
  // Uploaded files information
  uploadedFiles: [],
  // Submission fields
  outputFileName: "",
  targetFolderId: ""
};

type FormContextType = {
  form: FormState;
  setField: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  resetForm: () => void;
};

const FormContext = createContext<FormContextType | undefined>(undefined);

export function FormProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<FormState>(defaultState);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => setForm(defaultState);

  return (
    <FormContext.Provider value={{ form, setField, resetForm }}>
      {children}
    </FormContext.Provider>
  );
}

export function useFormContext() {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error("useFormContext must be used within a FormProvider");
  return ctx;
}
