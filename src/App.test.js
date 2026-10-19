import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the student database heading', () => {
  render(<App />);
  const heading = screen.getByRole('heading', { name: /student database/i });
  expect(heading).toBeInTheDocument();
});
