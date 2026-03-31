import { render, screen } from '@testing-library/react';

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(() => () => {}),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  FacebookAuthProvider: jest.fn(),
  GithubAuthProvider: jest.fn(),
}));

const App = require('./App').default;

test('renders the authentication landing screen', () => {
  render(<App />);
  expect(screen.getByText(/shape your/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /initialize access/i })).toBeInTheDocument();
});
