import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { Alert } from '../../src/components/feedback/Alert';
import { EmptyState } from '../../src/components/feedback/EmptyState';
import { ErrorBoundary } from '../../src/components/feedback/ErrorBoundary';

describe('UI Primitives & Feedback Components', () => {
  describe('Button', () => {
    it('renders button with children and responds to click', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Deploy Sensor</Button>);

      const btn = screen.getByRole('button', { name: /deploy sensor/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('sets aria-busy and disables interaction when isLoading is true', () => {
      const handleClick = vi.fn();
      render(
        <Button isLoading onClick={handleClick}>
          Submitting
        </Button>
      );

      const btn = screen.getByRole('button');
      expect(btn).toHaveAttribute('aria-busy', 'true');
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Badge', () => {
    it('renders badge with semantic text and dot', () => {
      render(
        <Badge variant="critical" dot>
          CRITICAL ALERT
        </Badge>
      );

      const badge = screen.getByText(/critical alert/i);
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Alert', () => {
    it('renders alert with role="alert" and handles dismiss', () => {
      const handleDismiss = vi.fn();
      render(
        <Alert
          severity="warning"
          title="Rainfall Warning"
          description="High precipitation detected"
          onDismiss={handleDismiss}
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Rainfall Warning')).toBeInTheDocument();

      const dismissBtn = screen.getByRole('button', { name: /dismiss alert/i });
      fireEvent.click(dismissBtn);
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('EmptyState', () => {
    it('renders title, description and triggers CTA button', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="No Alerts Found"
          description="There are currently no active alerts matching your criteria."
          action={{ label: 'Reset Filters', onClick: handleAction }}
        />
      );

      expect(screen.getByText('No Alerts Found')).toBeInTheDocument();
      const actionBtn = screen.getByRole('button', { name: /reset filters/i });
      fireEvent.click(actionBtn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('ErrorBoundary', () => {
    it('catches render error and renders recovery UI', () => {
      const ThrowError = () => {
        throw new Error('Sensor telemetry crash');
      };

      // Suppress console.error in test output for intentional error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary fallbackTitle="Custom Module Failure">
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Module Failure')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /recover module/i })).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });
});
