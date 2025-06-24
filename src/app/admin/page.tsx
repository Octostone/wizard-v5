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
const LOCAL_STORAGE_KEY = "admin_data_backup";

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
  const [input, setInput] = useState("");
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
    if (input.trim() && !items.includes(input.trim())) {
      setItems([...items, input.trim()]);
      setInput("");
    }
  };

  const handleDelete = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditValue(items[idx]);
  };

  const handleEditSave = (idx: number) => {
    if (editValue.trim() && !items.includes(editValue.trim())) {
      setItems(items.map((item, i) => (i === idx ? editValue.trim() : item)));
      setEditIdx(-1);
      setEditValue("");
    }
  };

  const handleEditCancel = () => {
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
          placeholder={`Add new ${label}`}
          value={input}
          onChange={e => setInput(e.target.value)}
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
      setAccountManagers([...accountManagers, { name: newName.trim(), email: newEmail.trim() }]);
      setNewName("");
      setNewEmail("");
    }
  };

  const handleDelete = (idx: number) => {
    setAccountManagers(accountManagers.filter((_, i) => i !== idx));
  };

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditName(accountManagers[idx].name);
    setEditEmail(accountManagers[idx].email);
  };

  const handleEditSave = (idx: number, name: string, email: string) => {
    if (name.trim() && !accountManagers.some((manager, i) => i !== idx && manager.name === name.trim())) {
      setAccountManagers(accountManagers.map((manager, i) => 
        i === idx ? { name: name.trim(), email: email.trim() } : manager
      ));
      setEditIdx(-1);
      setEditName("");
      setEditEmail("");
    }
  };

  const handleEditCancel = () => {
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
  const [showReAuthPrompt, setShowReAuthPrompt] = useState(false);
  const [reAuthPassword, setReAuthPassword] = useState("");

  const [accountManagers, setAccountManagers] = useState<AccountManager[]>([]);
  const [geo, setGeo] = useState<string[]>([]);
  const [os, setOs] = useState<string[]>([]);
  const [category1, setCategory1] = useState<string[]>([]);
  const [category2, setCategory2] = useState<string[]>([]);
  const [category3, setCategory3] = useState<string[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>(['GOAL', 'ADD', 'INITIAL', 'PURCHASE']);
  const [pubRevSources, setPubRevSources] = useState<string[]>(['IN EVENT NAME', 'IN POST BACK']);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'saving'>('idle');

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsedData: AdminData = JSON.parse(savedData);
        setAccountManagers(parsedData.accountManagers || []);
        setGeo(parsedData.geoOptions || []);
        setOs(parsedData.osOptions || []);
        setCategory1(parsedData.category1Options || ["Cat", "Dog", "Bird"]);
        setCategory2(parsedData.category2Options || ["Cat", "Dog", "Bird"]);
        setCategory3(parsedData.category3Options || ["Cat", "Dog", "Bird"]);
        setEventTypes(parsedData.eventTypeOptions || ['GOAL', 'ADD', 'INITIAL', 'PURCHASE']);
        setPubRevSources(parsedData.pubRevSourceOptions || ['IN EVENT NAME', 'IN POST BACK']);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (isAuthed) {
      const dataToSave: AdminData = {
        accountManagers,
        geoOptions: geo,
        osOptions: os,
        category1Options: category1,
        category2Options: category2,
        category3Options: category3,
        eventTypeOptions: eventTypes,
        pubRevSourceOptions: pubRevSources
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [accountManagers, geo, os, category1, category2, category3, eventTypes, pubRevSources, isAuthed]);

  // Fetch initial data from API
  useEffect(() => {
    if (isAuthed) {
      fetch("/api/admin")
        .then(res => {
          if (res.ok) {
            return res.json();
          } else {
            console.log('API blocked, using localStorage data');
            return null;
          }
        })
        .then(data => {
          if (data) {
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
          }
        })
        .catch(error => {
          console.log('API error, using localStorage data:', error);
        });
    }
  }, [isAuthed]);

  const handleSave = async () => {
    setSaveStatus('saving');
    
    // Always save to localStorage first
    const saveData: AdminData = { 
      accountManagers, 
      geoOptions: geo, 
      osOptions: os,
      category1Options: category1,
      category2Options: category2,
      category3Options: category3,
      eventTypeOptions: eventTypes,
      pubRevSourceOptions: pubRevSources
    };
    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(saveData));
    
    try {
      console.log('Attempting to save to server...');
      
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData)
      });
      
      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        console.log('Successfully saved to server');
      } else {
        console.log('Server save failed, data saved locally only');
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        alert('Data saved locally. Server sync may be unavailable due to authentication restrictions.');
      }
    } catch (error) {
      console.log('Server save error, data saved locally only:', error);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      alert('Data saved locally. Server sync may be unavailable due to authentication restrictions.');
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

  const handleReAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reAuthPassword === ADMIN_PASSWORD) {
      setShowReAuthPrompt(false);
      setReAuthPassword("");
      handleSave();
    } else {
      setError("Incorrect password");
    }
  };

  const handleSaveWithReAuth = () => {
    setShowReAuthPrompt(true);
    setError("");
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
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
              <button
                className={saveStatus === 'saved' ? `${styles.saveButton} ${styles.saveButtonSaved}` : styles.saveButton}
                onClick={handleSaveWithReAuth}
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saved' ? 'Saved!' : saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
            {saveStatus === 'saved' && (
              <div style={{ textAlign: 'center', color: 'green', marginBottom: 16 }}>
                ✓ Data saved successfully (local + server attempt)
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
        ) : showReAuthPrompt ? (
          <form className={styles.form} onSubmit={handleReAuthSubmit} style={{ maxWidth: 400, margin: '0 auto' }}>
            <h3 style={{ textAlign: 'center', marginBottom: 16 }}>Re-authenticate to Save</h3>
            <input
              className={styles.input}
              type="text"
              placeholder="Enter admin password"
              value={reAuthPassword}
              onChange={e => setReAuthPassword(e.target.value)}
              required
            />
            <button className={styles.actionButton} type="submit">
              Save Changes
            </button>
            <button 
              className={styles.actionButton} 
              type="button" 
              onClick={() => setShowReAuthPrompt(false)}
              style={{ background: '#eee', color: '#333', marginTop: 8 }}
            >
              Cancel
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