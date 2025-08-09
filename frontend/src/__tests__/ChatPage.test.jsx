import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatPage from '../pages/ChatPage';

describe('ChatPage', () => {
  test('renders message list, controls panel, and composer', () => {
    render(<ChatPage />);

    // Regions mount
    const list = screen.getByTestId('message-list');
    const controls = screen.getByTestId('controls-panel');
    const composer = screen.getByTestId('composer');

    expect(list).toBeInTheDocument();
    expect(controls).toBeInTheDocument();
    expect(composer).toBeInTheDocument();

    // A11y attributes
    expect(list).toHaveAttribute('aria-live', 'polite');

    // Layout class sanity checks
    expect(document.querySelector('.chat-main')).toBeTruthy();
    expect(document.querySelector('.chat-messages.card')).toBeTruthy();
    expect(document.querySelector('.chat-controls.card')).toBeTruthy();
  });
});
