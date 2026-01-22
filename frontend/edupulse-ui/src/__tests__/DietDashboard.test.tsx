import { render, screen, waitFor } from '@testing-library/react';
import DietDashboard from '../components/DietDashboard';

// Mock chart.js
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Doughnut: () => <div data-testid="doughnut-chart">Doughnut Chart</div>,
  Line: () => <div data-testid="line-chart">Line Chart</div>,
}));

// Mock API
jest.mock('../services/api', () => ({
  dietApi: {
    getAggregate: jest.fn(),
    generateModule: jest.fn(),
  },
}));

describe('DietDashboard', () => {
  it('renders DIET dashboard with mock data', async () => {
    render(<DietDashboard mockMode={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('DIET Dashboard')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('shows mock mode badge when enabled', async () => {
    render(<DietDashboard mockMode={true} />);
    
    await waitFor(() => {
      expect(screen.getByText(/MOCK DATA/)).toBeInTheDocument();
    });
  });
});
