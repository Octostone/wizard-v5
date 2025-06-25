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

// Types for account managers
interface AccountManager {
  name: string;
  email: string;
}

interface EmailTemplate {
  subject: string;
  body: string;
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
  // Email configuration
  emailTemplates: EmailTemplate;
  emailSettings: {
    defaultRecipients: string[];
    enableNotifications: boolean;
    notificationDelay: number; // in minutes
  };
  // Password change configuration
  passwordChangeSettings: {
    notificationRecipients: string[];
  };
  // Admin authentication
  adminPassword: string;
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

// Email Configuration Manager Component (Combined)
function EmailConfigManager({ 
  emailTemplates, 
  setEmailTemplates,
  emailSettings, 
  setEmailSettings 
}: { 
  emailTemplates: EmailTemplate; 
  setEmailTemplates: React.Dispatch<React.SetStateAction<EmailTemplate>>; 
  emailSettings: { defaultRecipients: string[]; enableNotifications: boolean; notificationDelay: number }; 
  setEmailSettings: React.Dispatch<React.SetStateAction<{ defaultRecipients: string[]; enableNotifications: boolean; notificationDelay: number }>>; 
}) {
  const [newRecipient, setNewRecipient] = useState('');

  const handleAddRecipient = () => {
    if (newRecipient.trim() && !emailSettings.defaultRecipients.includes(newRecipient.trim())) {
      setEmailSettings(prev => ({
        ...prev,
        defaultRecipients: [...prev.defaultRecipients, newRecipient.trim()]
      }));
      setNewRecipient('');
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setEmailSettings(prev => ({
      ...prev,
      defaultRecipients: prev.defaultRecipients.filter(r => r !== email)
    }));
  };

  return (
    <div className={styles.adminCard}>
      <h3>Email Configuration</h3>
      
      {/* Email Templates Section */}
      <div style={{ marginBottom: 32 }}>
        <h4 style={{ color: '#000000', fontWeight: 'bold', marginBottom: 16, fontSize: '1.1rem' }}>
          Email Templates
        </h4>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            Email Subject Template
          </label>
          <input
            className={styles.input}
            type="text"
            value={emailTemplates.subject}
            onChange={(e) => setEmailTemplates(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="Email subject template"
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 4 }}>
            Available placeholders: {'{accountManagerName}'}, {'{clientName}'}, {'{fileName}'}
          </div>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            Email Body Template
          </label>
          <textarea
            className={styles.input}
            value={emailTemplates.body}
            onChange={(e) => setEmailTemplates(prev => ({ ...prev, body: e.target.value }))}
            placeholder="Email body template (HTML supported)"
            style={{ width: '100%', minHeight: 200, resize: 'vertical' }}
          />
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 4 }}>
            Available placeholders: {'{accountManagerName}'}, {'{clientName}'}, {'{fileName}'}, {'{googleSheetUrl}'}, {'{googleFolderUrl}'}, {'{formSummary}'}
          </div>
        </div>
      </div>

      {/* Email Settings Section */}
      <div>
        <h4 style={{ color: '#000000', fontWeight: 'bold', marginBottom: 16, fontSize: '1.1rem' }}>
          Email Settings
        </h4>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={emailSettings.enableNotifications}
              onChange={(e) => setEmailSettings(prev => ({ ...prev, enableNotifications: e.target.checked }))}
            />
            <span style={{ fontWeight: 'bold' }}>Enable Email Notifications</span>
          </label>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            Notification Delay (minutes)
          </label>
          <input
            className={styles.input}
            type="number"
            min="0"
            max="60"
            value={emailSettings.notificationDelay}
            onChange={(e) => setEmailSettings(prev => ({ ...prev, notificationDelay: parseInt(e.target.value) || 0 }))}
            style={{ width: '100px' }}
          />
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 4 }}>
            Delay before sending notification (0 = immediate)
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            Default Additional Recipients
          </label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              className={styles.input}
              type="email"
              placeholder="email@example.com"
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRecipient()}
              style={{ flex: 1 }}
            />
            <button className={styles.actionButton} onClick={handleAddRecipient}>
              Add
            </button>
          </div>
          
          {emailSettings.defaultRecipients.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {emailSettings.defaultRecipients.map((email, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ flex: 1 }}>{email}</span>
                  <button 
                    className={styles.actionButton} 
                    onClick={() => handleRemoveRecipient(email)}
                    style={{ minWidth: 50, background: '#eee', color: '#333' }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 8, fontStyle: 'italic' }}>
            Account manager selected in workflow will by default receive email upon completion. The above additional recipients will also receive a copy for all submissions.
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordChangeManager({ 
  passwordChangeSettings, 
  setPasswordChangeSettings,
  adminPassword,
  setAdminPassword
}: { 
  passwordChangeSettings: { notificationRecipients: string[] }; 
  setPasswordChangeSettings: React.Dispatch<React.SetStateAction<{ notificationRecipients: string[] }>>; 
  adminPassword: string;
  setAdminPassword: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [newRecipient, setNewRecipient] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleAddRecipient = () => {
    if (newRecipient.trim() && !passwordChangeSettings.notificationRecipients.includes(newRecipient.trim())) {
      setPasswordChangeSettings(prev => ({
        ...prev,
        notificationRecipients: [...prev.notificationRecipients, newRecipient.trim()]
      }));
      setNewRecipient('');
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setPasswordChangeSettings(prev => ({
      ...prev,
      notificationRecipients: prev.notificationRecipients.filter(r => r !== email)
    }));
  };

  const handlePasswordChange = () => {
    // Validate passwords
    if (currentPassword !== adminPassword) {
      setPasswordError('Current password is incorrect');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    setPasswordError('');
    setShowConfirmModal(true);
  };

  const confirmPasswordChange = async () => {
    try {
      // Send email notification
      const response = await fetch('/api/send-password-change-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: currentPassword,
          newPassword: newPassword,
          recipients: passwordChangeSettings.notificationRecipients
        })
      });

      if (response.ok) {
        // Update the stored admin password
        setAdminPassword(newPassword);
        
        // Show success message
        alert('Password changed successfully! Email notifications sent. Please click "Save Changes" to persist the new password.');
        
        // Clear the form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowConfirmModal(false);
      } else {
        alert('Password changed but failed to send email notifications.');
      }
    } catch (error) {
      alert('Password changed but failed to send email notifications.');
    }
  };

  return (
    <>
      <div className={styles.adminPasswordCard}>
        <h3>Admin Password Management</h3>
        
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ color: '#000000', fontWeight: 'bold', marginBottom: 16, fontSize: '1.1rem' }}>
            Change Admin Password
          </h4>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              Current Password
            </label>
            <input
              className={styles.input}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              New Password
            </label>
            <input
              className={styles.input}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              Confirm New Password
            </label>
            <input
              className={styles.input}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              style={{ width: '100%' }}
            />
          </div>
          
          {passwordError && (
            <div style={{ color: '#d32f2f', marginBottom: 16, fontSize: '0.9rem' }}>
              {passwordError}
            </div>
          )}
          
          <button 
            className={styles.actionButton}
            onClick={handlePasswordChange}
            style={{ 
              background: '#d32f2f', 
              color: 'white',
              width: '100%',
              padding: '12px',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
          >
            Change Password
          </button>
        </div>

        <div>
          <h4 style={{ color: '#000000', fontWeight: 'bold', marginBottom: 16, fontSize: '1.1rem' }}>
            Password Change Notifications
          </h4>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              Notification Recipients
            </label>
            <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: 8 }}>
              These recipients will be notified when the admin password is changed
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                className={styles.input}
                type="email"
                placeholder="email@example.com"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRecipient()}
                style={{ flex: 1 }}
              />
              <button className={styles.actionButton} onClick={handleAddRecipient}>
                Add
              </button>
            </div>
            
            {passwordChangeSettings.notificationRecipients.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {passwordChangeSettings.notificationRecipients.map((email, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ flex: 1 }}>{email}</span>
                    <button 
                      className={styles.actionButton} 
                      onClick={() => handleRemoveRecipient(email)}
                      style={{ minWidth: 50, background: '#eee', color: '#333' }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalTitle}>⚠️ Confirm Password Change</div>
            <div className={styles.modalMessage}>
              Are you sure you want to change the admin password? This action cannot be undone and will send email notifications to all configured recipients.
            </div>
            <div className={styles.modalButtons}>
              <button 
                className={`${styles.modalButton} ${styles.modalButtonConfirm}`}
                onClick={confirmPasswordChange}
              >
                Yes, Change Password
              </button>
              <button 
                className={`${styles.modalButton} ${styles.modalButtonCancel}`}
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
  const [showApiStatus, setShowApiStatus] = useState(false); // Control API status visibility

  // Email configuration state
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate>({
    subject: 'New Campaign Created: {clientName} - {fileName}',
    body: `
      <h2>New Campaign Created</h2>
      <p>Hello {accountManagerName},</p>
      <p>A new campaign has been created for <strong>{clientName}</strong>.</p>
      
      <h3>Campaign Details:</h3>
      <ul>
        <li><strong>File Name:</strong> {fileName}</li>
        <li><strong>Google Sheet:</strong> <a href="{googleSheetUrl}">View Sheet</a></li>
        <li><strong>Google Folder:</strong> <a href="{googleFolderUrl}">View Folder</a></li>
      </ul>
      
      <h3>Form Summary:</h3>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
        {formSummary}
      </div>
      
      <p>Please review the campaign details and take any necessary actions.</p>
      
      <p>Best regards,<br>Flourish Wizard System</p>
    `
  });
  const [emailSettings, setEmailSettings] = useState({
    defaultRecipients: [] as string[],
    enableNotifications: true,
    notificationDelay: 0 // in minutes
  });

  // Password change configuration state
  const [passwordChangeSettings, setPasswordChangeSettings] = useState({
    notificationRecipients: [] as string[]
  });

  // Admin password state
  const [adminPassword, setAdminPassword] = useState('admin123'); // Default password

  // Fetch initial data from API
  useEffect(() => {
    if (isAuthed) {
      loadAdminData();
    }
  }, [isAuthed]);

  // Auto-focus password field when not authenticated
  useEffect(() => {
    if (!isAuthed) {
      const passwordInput = document.querySelector('input[type="text"][placeholder="Enter admin password"]') as HTMLInputElement;
      if (passwordInput) {
        passwordInput.focus();
      }
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
        setShowApiStatus(true);
        // Hide API status after 5 seconds
        setTimeout(() => setShowApiStatus(false), 5000);
        
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
        
        // Load email configuration
        if (data.emailTemplates) {
          setEmailTemplates(data.emailTemplates);
        }
        if (data.emailSettings) {
          setEmailSettings(data.emailSettings || {
            defaultRecipients: [],
            enableNotifications: true,
            notificationDelay: 0
          });
        }
        
        // Load password change configuration
        if (data.passwordChangeSettings) {
          setPasswordChangeSettings(data.passwordChangeSettings || {
            notificationRecipients: []
          });
        }
        
        // Load admin password
        if (data.adminPassword) {
          setAdminPassword(data.adminPassword);
        }
      } else {
        console.log('❌ API blocked, status:', response.status);
        setApiStatus('blocked');
        setShowApiStatus(true);
        // Hide API status after 5 seconds
        setTimeout(() => setShowApiStatus(false), 5000);
      }
    } catch (error) {
      console.log('❌ API error:', error);
      setApiStatus('blocked');
      setShowApiStatus(true);
      // Hide API status after 5 seconds
      setTimeout(() => setShowApiStatus(false), 5000);
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
      pubRevSourceOptions: pubRevSources,
      emailTemplates,
      emailSettings,
      passwordChangeSettings,
      adminPassword
    };
    
    const dataString = JSON.stringify(currentData);
    
    // Check if this data is the same as what we last saved to prevent unnecessary saves
    if (dataString === lastSavedData) {
      console.log('🔄 Data unchanged, skipping save');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 4000); // Changed to 4 seconds
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
        setTimeout(() => setSaveStatus('idle'), 4000); // Changed to 4 seconds
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
    if (password === adminPassword) {
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
            
            {/* API Status Indicator - only show for 5 seconds */}
            {showApiStatus && (
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
            )}
            
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
          <>
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
            
            {/* Visual separator */}
            <div className={styles.emailConfigSeparator}></div>
            
            {/* Email Configuration Section */}
            <div className={styles.emailConfigContainer}>
              <div className={styles.emailConfigGrid}>
                <EmailConfigManager 
                  emailTemplates={emailTemplates} 
                  setEmailTemplates={setEmailTemplates} 
                  emailSettings={emailSettings} 
                  setEmailSettings={setEmailSettings} 
                />
              </div>
            </div>
            
            {/* Visual separator */}
            <div className={styles.adminPasswordSeparator}></div>
            
            {/* Admin Password Management Section */}
            <div className={styles.adminPasswordContainer}>
              <div className={styles.adminPasswordGrid}>
                <PasswordChangeManager 
                  passwordChangeSettings={passwordChangeSettings} 
                  setPasswordChangeSettings={setPasswordChangeSettings} 
                  adminPassword={adminPassword}
                  setAdminPassword={setAdminPassword}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 