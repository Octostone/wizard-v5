"use client";
import React, { useState, useEffect } from "react";
import styles from "../page.module.css";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";

const ADMIN_PASSWORD = "admin123";

// Types for account managers
interface AccountManager {
  name: string;
  email: string;
}

interface AdminData {
  accountManagers: AccountManager[];
  geoOptions: string[];
  osOptions: string[];
  category1Options: string[];
  category2Options: string[];
  category3Options: string[];
  eventTypeOptions: string[];
  pubRevSourceOptions: string[];
}

type CrudManagerProps = {
  label: string;
  items: string[];
  setItems: React.Dispatch<React.SetStateAction<string[]>>;
};

type AccountManagerManagerProps = {
  accountManagers: AccountManager[];
  setAccountManagers: React.Dispatch<React.SetStateAction<AccountManager[]>>;
};

interface SortableItemProps {
  id: string;
  index: number;
  item: string;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onEditSave: (index: number) => void;
  onEditCancel: () => void;
  isEditing: boolean;
  editValue: string;
  setEditValue: (value: string) => void;
}

interface SortableAccountManagerItemProps {
  id: string;
  index: number;
  manager: AccountManager;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onEditSave: (index: number, name: string, email: string) => void;
  onEditCancel: () => void;
  isEditing: boolean;
  editName: string;
  editEmail: string;
  setEditName: (value: string) => void;
  setEditEmail: (value: string) => void;
}

function DragHandle() {
  return (
    <span className={styles.dragHandle} title="Drag to reorder">≡</span>
  );
}

function SortableItem({ id, index, item, onEdit, onDelete, onEditSave, onEditCancel, isEditing, editValue, setEditValue }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    background: isDragging ? '#f0f4ff' : undefined,
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes}>
      <span {...listeners} className={styles.dragHandle}>
        <DragHandle />
      </span>
      {isEditing ? (
        <>
          <input
            className={styles.input}
            style={{ flex: 1 }}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onEditSave(index)}
            autoFocus
          />
          <button className={styles.actionButton} style={{ minWidth: 50 }} type="button" onClick={() => onEditSave(index)}>
            Save
          </button>
          <button className={styles.actionButton} style={{ minWidth: 50, background: '#eee', color: '#333' }} type="button" onClick={onEditCancel}>
            Cancel
          </button>
        </>
      ) : (
        <>
          <span style={{ flex: 1, color: '#111' }}>{item}</span>
          <button className={styles.actionButton} style={{ minWidth: 50 }} type="button" onClick={() => onEdit(index)}>
            Edit
          </button>
          <button className={styles.actionButton} style={{ minWidth: 50, background: '#eee', color: '#333' }} type="button" onClick={() => onDelete(index)}>
            Delete
          </button>
        </>
      )}
    </li>
  );
}

function SortableAccountManagerItem({ 
  id, 
  index, 
  manager, 
  onEdit, 
  onDelete, 
  onEditSave, 
  onEditCancel, 
  isEditing, 
  editName, 
  editEmail, 
  setEditName, 
  setEditEmail 
}: SortableAccountManagerItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    background: isDragging ? '#f0f4ff' : undefined,
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes}>
      <span {...listeners} className={styles.dragHandle}>
        <DragHandle />
      </span>
      {isEditing ? (
        <>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <input
              className={styles.input}
              placeholder="Name"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onEditSave(index, editName, editEmail)}
            />
            <input
              className={styles.input}
              placeholder="Email"
              value={editEmail}
              onChange={e => setEditEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onEditSave(index, editName, editEmail)}
            />
          </div>
          <button className={styles.actionButton} style={{ minWidth: 50 }} type="button" onClick={() => onEditSave(index, editName, editEmail)}>
            Save
          </button>
          <button className={styles.actionButton} style={{ minWidth: 50, background: '#eee', color: '#333' }} type="button" onClick={onEditCancel}>
            Cancel
          </button>
        </>
      ) : (
        <>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#111', fontWeight: 'bold' }}>{manager.name}</div>
            <div style={{ color: '#666', fontSize: '0.9em' }}>{manager.email || 'No email set'}</div>
          </div>
          <button className={styles.actionButton} style={{ minWidth: 50 }} type="button" onClick={() => onEdit(index)}>
            Edit
          </button>
          <button className={styles.actionButton} style={{ minWidth: 50, background: '#eee', color: '#333' }} type="button" onClick={() => onDelete(index)}>
            Delete
          </button>
        </>
      )}
    </li>
  );
}

function CrudManager({ label, items, setItems }: CrudManagerProps) {
  const [newItem, setNewItem] = useState("");
  const [editIdx, setEditIdx] = useState<number>(-1);
  const [editValue, setEditValue] = useState("");

  // dnd-kit setup
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && over) {
      const oldIndex = items.findIndex((item) => item === active.id);
      const newIndex = items.findIndex((item) => item === over.id);
      setItems(arrayMove(items, oldIndex, newIndex));
    }
  };

  const handleAdd = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      console.log('➕ Adding new item to', label, ':', newItem.trim());
      setItems(prev => [...prev, newItem.trim()]);
      setNewItem("");
    }
  };

  const handleDelete = (idx: number) => {
    console.log('🗑️ Deleting item from', label, 'at index:', idx);
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleEdit = (idx: number) => {
    console.log('✏️ Starting edit for', label, 'at index:', idx);
    setEditIdx(idx);
    setEditValue(items[idx]);
  };

  const handleEditSave = (idx: number) => {
    if (editValue.trim() && !items.some((item, i) => i !== idx && item === editValue.trim())) {
      console.log('💾 Saving edit for', label, 'at index:', idx, 'New value:', editValue.trim());
      setItems(prev => prev.map((item, i) => i === idx ? editValue.trim() : item));
      setEditIdx(-1);
      setEditValue("");
    } else {
      console.log('❌ Edit validation failed for', label, '- duplicate value or empty value');
    }
  };

  const handleEditCancel = () => {
    console.log('❌ Canceling edit for', label);
    setEditIdx(-1);
    setEditValue("");
  };

  return (
    <div className={styles.adminCrudContainer}>
      <h2 style={{ color: 'var(--color-header)', marginBottom: 16, textAlign: 'center' }}>{label}</h2>
      <div className={styles.addRow}>
        <input
          className={styles.input}
          type="text"
          placeholder={`Add ${label}`}
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button className={styles.actionButton} type="button" onClick={handleAdd}>
          Add
        </button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {items.map((item, idx) => (
              <SortableItem
                key={item}
                id={item}
                index={idx}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onEditSave={handleEditSave}
                onEditCancel={handleEditCancel}
                isEditing={editIdx === idx}
                editValue={editValue}
                setEditValue={setEditValue}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function AccountManagerManager({ accountManagers, setAccountManagers }: AccountManagerManagerProps) {
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [editIdx, setEditIdx] = useState<number>(-1);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // dnd-kit setup
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && over) {
      const oldIndex = accountManagers.findIndex((manager) => manager.name === active.id);
      const newIndex = accountManagers.findIndex((manager) => manager.name === over.id);
      setAccountManagers(arrayMove(accountManagers, oldIndex, newIndex));
    }
  };

  const handleAdd = () => {
    if (newName.trim() && !accountManagers.some(manager => manager.name === newName.trim())) {
      const newManager = { name: newName.trim(), email: newEmail.trim() };
      console.log('➕ Adding new account manager:', newManager);
      setAccountManagers(prev => [...prev, newManager]);
      setNewName("");
      setNewEmail("");
    }
  };

  const handleDelete = (idx: number) => {
    console.log('🗑️ Deleting account manager at index:', idx);
    setAccountManagers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleEdit = (idx: number) => {
    console.log('✏️ Starting edit for account manager at index:', idx);
    setEditIdx(idx);
    setEditName(accountManagers[idx].name);
    setEditEmail(accountManagers[idx].email);
  };

  const handleEditSave = (idx: number, name: string, email: string) => {
    if (name.trim() && !accountManagers.some((manager, i) => i !== idx && manager.name === name.trim())) {
      const updatedManager = { name: name.trim(), email: email.trim() };
      console.log('💾 Saving edit for account manager at index:', idx, 'New data:', updatedManager);
      
      setAccountManagers(prev => prev.map((manager, i) => 
        i === idx ? updatedManager : manager
      ));
      
      setEditIdx(-1);
      setEditName("");
      setEditEmail("");
    } else {
      console.log('❌ Edit validation failed - duplicate name or empty name');
    }
  };

  const handleEditCancel = () => {
    console.log('❌ Canceling edit');
    setEditIdx(-1);
    setEditName("");
    setEditEmail("");
  };

  return (
    <div className={styles.adminCrudContainer}>
      <h2 style={{ color: 'var(--color-header)', marginBottom: 16, textAlign: 'center' }}>Account Managers</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <input
          className={styles.input}
          type="text"
          placeholder="Account Manager Name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <input
          className={styles.input}
          type="email"
          placeholder="Email Address"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button className={styles.actionButton} type="button" onClick={handleAdd}>
          Add Account Manager
        </button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={accountManagers.map(m => m.name)} strategy={verticalListSortingStrategy}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {accountManagers.map((manager, idx) => (
              <SortableAccountManagerItem
                key={manager.name}
                id={manager.name}
                index={idx}
                manager={manager}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onEditSave={handleEditSave}
                onEditCancel={handleEditCancel}
                isEditing={editIdx === idx}
                editName={editName}
                editEmail={editEmail}
                setEditName={setEditName}
                setEditEmail={setEditEmail}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [error, setError] = useState("");

  const [accountManagers, setAccountManagers] = useState<AccountManager[]>([]);
  const [geo, setGeo] = useState<string[]>([]);
  const [os, setOs] = useState<string[]>([]);
  const [category1, setCategory1] = useState<string[]>([]);
  const [category2, setCategory2] = useState<string[]>([]);
  const [category3, setCategory3] = useState<string[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>(['GOAL', 'ADD', 'INITIAL', 'PURCHASE']);
  const [pubRevSources, setPubRevSources] = useState<string[]>(['IN EVENT NAME', 'IN POST BACK']);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'saving' | 'error'>('idle');
  const [apiStatus, setApiStatus] = useState<'unknown' | 'working' | 'blocked'>('unknown');
  const [lastSavedData, setLastSavedData] = useState<string>(''); // Track last saved data to prevent overwrites

  // Fetch initial data from API
  useEffect(() => {
    if (isAuthed) {
      loadAdminData();
    }
  }, [isAuthed]);

  const loadAdminData = async () => {
    console.log('🔄 Loading admin data from API...');
    try {
      // Add cache-busting parameter to prevent caching
      const response = await fetch(`/api/admin?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('📡 API response status:', response.status);
      if (response.ok) {
        setApiStatus('working');
        const data = await response.json();
        console.log('✅ Successfully loaded data from API');
        console.log('📊 Loaded data:', data);
        
        // Handle migration from old format
        if (data.accountManagers && data.accountManagers.length > 0 && typeof data.accountManagers[0] === 'string') {
          setAccountManagers(data.accountManagers.map((name: string) => ({ name, email: '' })));
        } else {
          setAccountManagers(data.accountManagers || []);
        }
        setGeo(data.geoOptions || []);
        setOs(data.osOptions || []);
        setCategory1(data.category1Options || ["Cat", "Dog", "Bird"]);
        setCategory2(data.category2Options || ["Cat", "Dog", "Bird"]);
        setCategory3(data.category3Options || ["Cat", "Dog", "Bird"]);
        setEventTypes(data.eventTypeOptions || ['GOAL', 'ADD', 'INITIAL', 'PURCHASE']);
        setPubRevSources(data.pubRevSourceOptions || ['IN EVENT NAME', 'IN POST BACK']);
      } else {
        console.log('❌ API blocked, status:', response.status);
        setApiStatus('blocked');
      }
    } catch (error) {
      console.log('❌ API error:', error);
      setApiStatus('blocked');
    }
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    
    // Create a snapshot of current state to ensure we save the latest data
    const currentData = { 
      accountManagers, 
      geoOptions: geo, 
      osOptions: os,
      category1Options: category1,
      category2Options: category2,
      category3Options: category3,
      eventTypeOptions: eventTypes,
      pubRevSourceOptions: pubRevSources
    };
    
    const dataString = JSON.stringify(currentData);
    
    // Check if this data is the same as what we last saved to prevent unnecessary saves
    if (dataString === lastSavedData) {
      console.log('🔄 Data unchanged, skipping save');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return;
    }
    
    try {
      console.log('💾 Attempting to save to server...');
      console.log('📊 Data to save:', currentData);
      
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: dataString
      });
      
      if (res.ok) {
        console.log('✅ Successfully saved to server');
        setSaveStatus('saved');
        setApiStatus('working');
        setLastSavedData(dataString); // Update last saved data
        
        // Don't auto-refresh immediately - let the user see their changes
        // Only refresh if there's a significant delay or user action
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        console.log('❌ Server save failed, status:', res.status);
        const errorText = await res.text();
        console.log('❌ Error response:', errorText);
        setSaveStatus('error');
        setApiStatus('blocked');
        alert(`Failed to save changes. Status: ${res.status}. This may be due to authentication restrictions.`);
      }
    } catch (error) {
      console.log('❌ Server save error:', error);
      setSaveStatus('error');
      setApiStatus('blocked');
      alert(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}. This may be due to authentication restrictions.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthed(true);
      setError("");
    } else {
      setError("Incorrect password");
    }
  };

  return (
    <div className={styles.page}>
      <div style={{ width: '100%' }}>
        <div className={styles.adminHeaderContainer}>
          <h1 className={styles.title}>Admin Access</h1>
        </div>
        {isAuthed && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <Link href="/" className={styles.actionButton} style={{ width: 320, textAlign: 'center', fontSize: '1.1rem' }}>
                Return to Landing Page
              </Link>
            </div>
            
            {/* API Status Indicator */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: 16,
              padding: '8px 16px',
              borderRadius: '4px',
              backgroundColor: apiStatus === 'working' ? '#d4edda' : apiStatus === 'blocked' ? '#f8d7da' : '#fff3cd',
              color: apiStatus === 'working' ? '#155724' : apiStatus === 'blocked' ? '#721c24' : '#856404',
              border: `1px solid ${apiStatus === 'working' ? '#c3e6cb' : apiStatus === 'blocked' ? '#f5c6cb' : '#ffeaa7'}`
            }}>
              {apiStatus === 'working' && '✓ API Connection Working'}
              {apiStatus === 'blocked' && '⚠ API Blocked - Changes may not persist'}
              {apiStatus === 'unknown' && '⏳ Checking API connection...'}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32, gap: 16 }}>
              <button
                className={saveStatus === 'saved' ? `${styles.saveButton} ${styles.saveButtonSaved}` : 
                         saveStatus === 'error' ? `${styles.saveButton} ${styles.saveButtonError}` : 
                         styles.saveButton}
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                style={{ width: 200 }}
              >
                {saveStatus === 'saved' ? 'Saved!' : 
                 saveStatus === 'saving' ? 'Saving...' : 
                 saveStatus === 'error' ? 'Save Failed' : 'Save Changes'}
              </button>
              
              <button
                className={styles.actionButton}
                onClick={loadAdminData}
                style={{ width: 120, height: 48 }}
              >
                Refresh Data
              </button>
            </div>
            
            {saveStatus === 'saved' && (
              <div style={{ textAlign: 'center', color: 'green', marginBottom: 16 }}>
                ✓ Changes saved successfully
              </div>
            )}
            
            {saveStatus === 'error' && (
              <div style={{ textAlign: 'center', color: 'red', marginBottom: 16 }}>
                ✗ Save failed - API may be blocked by authentication
              </div>
            )}
          </>
        )}
        {!isAuthed ? (
          <form className={styles.form} onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto' }}>
            <input
              className={styles.input}
              type="text"
              placeholder="Enter admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button className={styles.actionButton} type="submit">
              Login
            </button>
            {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
          </form>
        ) : (
          <div className={styles.adminGrid}>
            <AccountManagerManager accountManagers={accountManagers} setAccountManagers={setAccountManagers} />
            <CrudManager label="Geo" items={geo} setItems={setGeo} />
            <CrudManager label="OS" items={os} setItems={setOs} />
            <CrudManager label="Category 1" items={category1} setItems={setCategory1} />
            <CrudManager label="Category 2" items={category2} setItems={setCategory2} />
            <CrudManager label="Category 3" items={category3} setItems={setCategory3} />
            <CrudManager label="Event Types" items={eventTypes} setItems={setEventTypes} />
            <CrudManager label="Pub Rev Sources" items={pubRevSources} setItems={setPubRevSources} />
          </div>
        )}
      </div>
    </div>
  );
} 