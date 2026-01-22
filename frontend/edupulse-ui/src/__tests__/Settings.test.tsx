import { render, screen, fireEvent } from '@testing-library/react';
import Settings from '../components/Settings';

describe('Settings', () => {
  it('renders settings modal', () => {
    const onClose = jest.fn();
    render(
      <Settings
        mockMode={false}
        onMockModeChange={jest.fn()}
        onClose={onClose}
      />
    );
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText(/Mock Mode/)).toBeInTheDocument();
  });

  it('toggles mock mode', () => {
    const onMockModeChange = jest.fn();
    render(
      <Settings
        mockMode={false}
        onMockModeChange={onMockModeChange}
        onClose={jest.fn()}
      />
    );
    
    const checkbox = screen.getByLabelText('Toggle mock mode');
    fireEvent.click(checkbox);
    
    expect(onMockModeChange).toHaveBeenCalledWith(true);
  });

  it('shows mock mode active state', () => {
    render(
      <Settings
        mockMode={true}
        onMockModeChange={jest.fn()}
        onClose={jest.fn()}
      />
    );
    
    expect(screen.getByText(/All network calls will use local mock data/)).toBeInTheDocument();
  });
});
