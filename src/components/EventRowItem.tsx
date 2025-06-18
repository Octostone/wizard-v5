"use client";
import React, { useEffect, useRef } from 'react';
import styles from '../app/page.module.css';
import { EventItem } from '../context/FormContext';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface EventRowItemProps {
  event: EventItem;
  index: number;
  isFirstRow: boolean;
  eventTypes: string[];
  pubReveSources: string[];
  onUpdate: (index: number, field: keyof EventItem, value: string) => void;
  onDelete: (index: number) => void;
  positions: string[];
  crPercentClass?: string;
  eventTypeClass?: string;
  pubRevSourceClass?: string;
  isNewRow?: boolean;
}

export default function EventRowItem({
  event,
  index,
  isFirstRow,
  eventTypes,
  pubReveSources,
  onUpdate,
  onDelete,
  positions,
  crPercentClass = '',
  eventTypeClass = '',
  pubRevSourceClass = '',
  isNewRow = false
}: EventRowItemProps) {
  const descriptionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNewRow && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, [isNewRow]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1
  };

  // Format TTC value with commas
  const formatTTC = (value: string) => {
    // Remove any non-numeric characters first
    const numericValue = value.replace(/[^\d]/g, '');
    // Format with commas
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Validate position is unique
  const isPositionValid = (position: string) => {
    if (positions.filter(p => p === position).length > 1) {
      return false;
    }
    return true;
  };

  // Handle position change
  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric values, no commas or decimals
    const value = e.target.value.replace(/[^\d]/g, '');
    onUpdate(index, 'position', value);
  };

  // Handle postback event name change
  const handlePostbackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove spaces
    const value = e.target.value.replace(/\s/g, '');
    onUpdate(index, 'postbackEventName', value);
  };

  // Handle Est CR % change
  const handleCRPercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers with up to one decimal place
    const value = e.target.value.replace(/[^\d.]/g, '');
    // Ensure only one decimal point
    const parts = value.split('.');
    const formattedValue = parts.length > 1 
      ? `${parts[0]}.${parts[1].slice(0, 1)}` 
      : value;
    onUpdate(index, 'estCRPercent', formattedValue);
  };

  // Handle Est TTC Mins change
  const handleTTCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric values up to 6 digits
    const value = e.target.value.replace(/[^\d]/g, '');
    if (value.length <= 6) {
      onUpdate(index, 'estTTCMins', formatTTC(value));
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={styles.eventRow}
    >
      <div {...attributes} {...listeners} className={styles.eventDragHandle}>≡</div>
      
      <div className={styles.eventField}>
        <input
          type="text"
          className={`${styles.eventFieldInput} ${styles.eventInputShort} ${!isPositionValid(event.position) ? 'border-red-500' : ''}`}
          value={event.position}
          onChange={handlePositionChange}
          placeholder="Position"
        />
      </div>
      
      <div className={styles.eventField}>
        <input
          ref={descriptionInputRef}
          type="text"
          className={`${styles.eventFieldInput} ${styles.eventInputExtraLong}`}
          value={event.name}
          onChange={(e) => onUpdate(index, 'name', e.target.value)}
          placeholder="Event Description"
        />
      </div>
      
      <div className={styles.eventField}>
        <input
          type="text"
          className={`${styles.eventFieldInput} ${styles.eventInputLong}`}
          value={event.postbackEventName}
          onChange={handlePostbackChange}
          placeholder="Postback Event Name"
        />
      </div>
      
      <div className={styles.eventField}>
        <input
          type="text"
          className={`${styles.eventFieldInput} ${crPercentClass}`}
          value={event.estCRPercent}
          onChange={handleCRPercentChange}
          placeholder="Est. CR %"
        />
      </div>
      
      <div className={styles.eventField}>
        <input
          type="text"
          className={`${styles.eventFieldInput} ${styles.eventInputMedium}`}
          value={event.estTTCMins}
          onChange={handleTTCChange}
          placeholder="Est. TTC"
        />
      </div>
      
      <div className={styles.eventField}>
        <select
          className={`${styles.eventFieldInput} ${eventTypeClass}`}
          value={event.eventType}
          onChange={(e) => onUpdate(index, 'eventType', e.target.value)}
        >
          <option value="" disabled>Event Type</option>
          {eventTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      
      <div className={styles.eventField}>
        <select
          className={`${styles.eventFieldInput} ${pubRevSourceClass}`}
          value={event.pubReveSource}
          onChange={(e) => onUpdate(index, 'pubReveSource', e.target.value)}
        >
          <option value="" disabled>Pub REV Source</option>
          {pubReveSources.map((source) => (
            <option key={source} value={source}>{source}</option>
          ))}
        </select>
      </div>
      
      {!isFirstRow && (
        <button 
          type="button" 
          className={styles.eventDeleteButton}
          onClick={() => onDelete(index)}
          aria-label="Delete row"
        >
          🗑️
        </button>
      )}
    </div>
  );
}