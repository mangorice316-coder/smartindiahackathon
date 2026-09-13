import React from 'react';

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface AlertProps {
  severity?: AlertSeverity;
  title: string;
  description?: string;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}
