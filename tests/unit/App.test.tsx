import { describe, it, expect } from 'vitest';
import { render, screen } from '../helpers/render';
import App from '@/App';

describe('App Component', () => {
  it('should render the app without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('should render the Header component', () => {
    render(<App />);
    const header = screen.getByRole('banner', { hidden: true });
    expect(header).toBeTruthy();
  });

  it('should render main content area', () => {
    const { container } = render(<App />);
    expect(container.querySelector('main')).toBeTruthy();
  });
});
