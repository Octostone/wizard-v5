"use client";
import React, { useState, useEffect } from "react";
import styles from "../page.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormContext, EventItem } from "../../context/FormContext";
import ClearButton from "../../components/ClearButton";
import EventRowItem from "../../components/EventRowItem";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";

export default function AddEvents() {
  const router = useRouter();
  const { form, setField } = useFormContext();
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [pubReveSources, setPubReveSources] = useState<string[]>([]);
  
  // Get existing event positions
  const positions = form.events.map(event => event.position);

  // DnD setup
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 10 }
  }));
  
  useEffect(() => {
    // Fetch admin settings
    fetch("/api/admin")
      .then(res => res.json())
      .then(data => {
        setEventTypes(data.eventTypeOptions || ['GOAL', 'ADD', 'INITIAL', 'PURCHASE']);
        setPubReveSources(data.pubReveSourceOptions || ['IN EVENT NAME', 'IN POST BACK']);
      })
      .catch(() => {
        setEventTypes(['GOAL', 'ADD', 'INITIAL', 'PURCHASE']);
        setPubReveSources(['IN EVENT NAME', 'IN POST BACK']);
      });
  }, []);
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active && over && active.id !== over.id) {
      const oldIndex = form.events.findIndex(item => item.id === active.id);
      const newIndex = form.events.findIndex(item => item.id === over.id);
      
      const reorderedEvents = arrayMove(form.events, oldIndex, newIndex);
      
      // Update positions after reordering
      const updatedEvents = reorderedEvents.map((event, index) => ({
        ...event,
        position: (index + 1).toString()
      }));
      
      setField('events', updatedEvents);
    }
  };
  
  const handleUpdateEvent = (index: number, field: keyof EventItem, value: string) => {
    const updatedEvents = [...form.events];
    updatedEvents[index] = {
      ...updatedEvents[index],
      [field]: value
    };
    setField('events', updatedEvents);
  };
  
  const handleAddRow = () => {
    const newEvent: EventItem = {
      id: `event-${Date.now()}`,
      position: (form.events.length + 1).toString(),
      name: "",
      postbackEventName: "",
      estCRPercent: "",
      estTTCMins: "",
      eventType: "",
      pubReveSource: ""
    };
    
    setField('events', [...form.events, newEvent]);
  };
  
  const handleDeleteRow = (index: number) => {
    if (index === 0 && form.events.length === 1) {
      // Don't delete the last row
      return;
    }
    
    const updatedEvents = form.events.filter((_, i) => i !== index);
    
    // Update positions after deletion
    const eventsWithUpdatedPositions = updatedEvents.map((event, idx) => ({
      ...event,
      position: (idx + 1).toString()
    }));
    
    setField('events', eventsWithUpdatedPositions);
  };

  return (
    <div className={styles.page}>
      <div className={styles.eventsContainer}>
        <h1 className={styles.title}>Add Events</h1>
        
        {/* Column Headers */}
        <div className={styles.eventsHeader}>
          <div className={styles.eventDragHandle}></div>
          <div className={styles.eventField}>
            <div className={`${styles.eventColumnHeader} ${styles.eventInputShort}`}>Position</div>
          </div>
          <div className={styles.eventField}>
            <div className={`${styles.eventColumnHeader} ${styles.eventInputExtraLong}`}>Event Description</div>
          </div>
          <div className={styles.eventField}>
            <div className={`${styles.eventColumnHeader} ${styles.eventInputLong}`}>Postback Event Name</div>
          </div>
          <div className={styles.eventField}>
            <div className={`${styles.eventColumnHeader} ${styles.eventInputCRPercent}`}>Est CR %</div>
          </div>
          <div className={styles.eventField}>
            <div className={`${styles.eventColumnHeader} ${styles.eventInputMedium}`}>Est. TTC (Mins)</div>
          </div>
          <div className={styles.eventField}>
            <div className={`${styles.eventColumnHeader} ${styles.eventInputEventType}`}>Event Type</div>
          </div>
          <div className={styles.eventField}>
            <div className={`${styles.eventColumnHeader} ${styles.eventInputPubRevSource}`}>Pub REV Source</div>
          </div>
        </div>
        
        {/* Event Rows */}
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={form.events.map(event => event.id)}
            strategy={verticalListSortingStrategy}
          >
            {form.events.map((event, index) => (
              <EventRowItem
                key={event.id}
                event={event}
                index={index}
                isFirstRow={index === 0 && form.events.length === 1}
                eventTypes={eventTypes}
                pubReveSources={pubReveSources}
                onUpdate={handleUpdateEvent}
                onDelete={handleDeleteRow}
                positions={positions}
                crPercentClass={styles.eventInputCRPercent}
                eventTypeClass={styles.eventInputEventType}
                pubRevSourceClass={styles.eventInputPubRevSource}
              />
            ))}
          </SortableContext>
        </DndContext>
        
        {/* Add Row Button */}
        <div className={styles.addEventRowButtonContainer}>
          <button className={styles.addEventRowButton} onClick={handleAddRow} type="button">
            + Add Event Row
          </button>
        </div>
        
        {/* Navigation Buttons */}
        <div className={styles.navButtonGroup}>
          <button 
            type="button" 
            className={`${styles.navButton} ${styles.navButtonBack}`} 
            onClick={() => router.back()}
          >
            Back
          </button>
          <Link 
            href="/add-campaign" 
            className={`${styles.navButton} ${styles.navButtonNext}`}
          >
            Next
          </Link>
        </div>
        <ClearButton />
      </div>
    </div>
  );
}
