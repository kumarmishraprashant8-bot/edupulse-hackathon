import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LfaWizard from '../components/LfaWizard';

// Mock API
jest.mock('../services/api', () => ({
  lfaApi: {
    exportLFA: jest.fn(),
  },
}));

describe('LfaWizard', () => {
  it('renders LFA wizard', () => {
    render(<LfaWizard mockMode={true} />);
    expect(screen.getByText('LFA Wizard')).toBeInTheDocument();
    expect(screen.getByText('Problem Statement')).toBeInTheDocument();
  });

  it('navigates through steps', () => {
    render(<LfaWizard mockMode={true} />);
    
    const nextButton = screen.getByText('Next →');
    fireEvent.click(nextButton);
    
    expect(screen.getByText('Student Change')).toBeInTheDocument();
  });

  it('loads example data', () => {
    render(<LfaWizard mockMode={true} />);
    
    const loadExampleButton = screen.getByText('📋 Load Example');
    fireEvent.click(loadExampleButton);
    
    // Check if example data is loaded (title field should be filled)
    const titleInput = screen.getByPlaceholderText('FLN Intervention 2026');
    expect(titleInput).toHaveValue('FLN Intervention 2026');
  });

  it('completes wizard and exports', async () => {
    render(<LfaWizard mockMode={true} />);
    
    // Load example
    fireEvent.click(screen.getByText('📋 Load Example'));
    
    // Navigate to last step
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByText('Next →'));
    }
    
    // Export
    const exportButton = screen.getByText('📥 Export PPTX');
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Export successful/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
