import React from 'react';

export type BadgeVariant = 'critical' | 'high' | 'warning' | 'moderate' | 'low' | 'success' | 'info' | 'purple' | 'neutral';
export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}
