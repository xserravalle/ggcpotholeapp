import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AccessibilityProvider } from '@/context/AccessibilityContext';
import { AuthProvider } from '@/context/AuthContext';
import { ReportsProvider } from '@/context/ReportsContext';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <ReportsProvider>
          {children}
        </ReportsProvider>
      </AccessibilityProvider>
    </AuthProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
