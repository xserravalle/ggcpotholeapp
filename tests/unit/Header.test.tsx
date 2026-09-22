import { describe, it, expect } from 'vitest';
import { render, screen } from '../helpers/render';
import Header from '@/components/Header';

describe('Header Component', () => {
  it('should render the header without crashing', () => {
    const { container } = render(<Header mode="campus" setMode={() => {}} />);
    expect(container).toBeTruthy();
  });

  it('should render mode switcher buttons', () => {
    render(<Header mode="campus" setMode={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should display current mode', () => {
    const { rerender } = render(<Header mode="campus" setMode={() => {}} />);
    expect(screen.getByText(/campus/i, { hidden: true })).toBeTruthy();

    rerender(<Header mode="county" setMode={() => {}} />);
    expect(screen.getByText(/county/i, { hidden: true })).toBeTruthy();
  });
});
