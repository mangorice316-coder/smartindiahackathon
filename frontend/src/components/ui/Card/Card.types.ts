import React from 'react';

export type CardVariant = 'default' | 'elevated' | 'interactive' | 'bordered' | 'cyan' | 'amber' | 'red';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}
