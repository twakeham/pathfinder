import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders sign in form', () => {
  render(<App />);
  // The landing screen shows the auth sign-in UI
  const heading = screen.getByRole('heading', { name: /sign in/i });
  expect(heading).toBeInTheDocument();
});
