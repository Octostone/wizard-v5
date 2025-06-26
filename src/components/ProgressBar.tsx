import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ProgressStep {
  name: string;
  path: string;
}

interface ProgressBarProps {
  steps: ProgressStep[];
}

export default function ProgressBar({ steps }: ProgressBarProps) {
  const pathname = usePathname();

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      width: '100%',
      background: 'var(--color-bg-container)',
      padding: '20px 0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
      zIndex: 10
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: 4,
        maxWidth: '100%',
        overflow: 'hidden',
        flexWrap: 'nowrap'
      }}>
        {steps.map((step, idx, arr) => (
          <React.Fragment key={step.path}>
            <Link href={step.path} style={{
              padding: '4px 8px',
              borderRadius: 12,
              background: pathname === step.path ? '#1976d2' : '#e3eafc',
              color: pathname === step.path ? '#fff' : '#1976d2',
              fontWeight: pathname === step.path ? 600 : 400,
              textDecoration: 'none',
              fontSize: 13,
              lineHeight: 1.2,
              border: pathname === step.path ? '2px solid #1976d2' : '2px solid #e3eafc',
              transition: 'background 0.2s, color 0.2s, border 0.2s',
              cursor: 'pointer',
              maxHeight: '2.4em',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              minWidth: '60px',
              textAlign: 'center'
            }}>
              {step.name}
            </Link>
            {idx < arr.length - 1 && (
              <span style={{ 
                color: '#888', 
                margin: '0 2px', 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '12px'
              }}>
                ▶
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
} 