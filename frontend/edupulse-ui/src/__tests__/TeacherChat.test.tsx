import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TeacherChat from '../components/TeacherChat';

// Mock the API
jest.mock('../lib/api', () => ({
  teacherApi: {
    createTeacherQuery: jest.fn(),
    flagToCrp: jest.fn(),
    getSampleResponse: jest.fn(),
  },
  dietApi: {
    getAggregate: jest.fn(),
    generateModule: jest.fn(),
  },
  compressImage: jest.fn((file) => Promise.resolve(file)),
}));

// Mock useOfflineFallback
jest.mock('../hooks/useOfflineFallback', () => ({
  useOfflineFallback: () => ({
    isMockMode: false,
    failureCount: 0,
    enableMockMode: jest.fn(),
    disableMockMode: jest.fn(),
    recordFailure: jest.fn(),
    recordSuccess: jest.fn(),
  }),
}));

// Mock mockData
jest.mock('../mock/seed.json', () => ({
  teacherQueries: [
    {
      id: 'mock-1',
      advice: 'Try this 3-step pebble activity:\n1. Use 10 pebbles in groups.\n2. Show 13-7 concretely.\n3. Practice with zero.',
      module_sample_link: 'http://example.com/module.pptx',
    },
  ],
}));

describe('TeacherChat', () => {
  it('renders teacher chat hero section', () => {
    render(<TeacherChat mockMode={true} />);
    expect(screen.getByText(/Teacher Chat — quick help in the classroom/)).toBeInTheDocument();
  });

  it('renders input with correct placeholder', () => {
    render(<TeacherChat mockMode={true} />);
    const input = screen.getByPlaceholderText(/Describe the classroom problem in one sentence/);
    expect(input).toBeInTheDocument();
  });

  it('submits form and shows advice card', async () => {
    const { teacherApi } = require('../lib/api');
    teacherApi.createTeacherQuery.mockResolvedValue({
      ok: true,
      data: {
        id: 'test-1',
        advice: 'Try this:\n1. First step\n2. Second step',
        module_sample_link: 'http://example.com/module.pptx',
        consent_required: false,
      },
    });

    render(<TeacherChat mockMode={false} />);
    
    const input = screen.getByPlaceholderText(/Describe the classroom problem in one sentence/);
    fireEvent.change(input, { target: { value: 'Students confused about subtraction' } });
    
    const submitButton = screen.getByLabelText('Send message');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Try this in the next 10 minutes/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows quick chips', () => {
    render(<TeacherChat mockMode={true} />);
    expect(screen.getByText('Classroom management')).toBeInTheDocument();
    expect(screen.getByText('Concept confusion')).toBeInTheDocument();
  });

  it('handles chip click', () => {
    render(<TeacherChat mockMode={true} />);
    const chip = screen.getByText('Concept confusion');
    fireEvent.click(chip);
    const input = screen.getByPlaceholderText(/Describe the classroom problem in one sentence/) as HTMLInputElement;
    expect(input.value).toBe('Concept confusion');
  });

  it('handles Enter key submission', async () => {
    const { teacherApi } = require('../lib/api');
    teacherApi.createTeacherQuery.mockResolvedValue({
      ok: true,
      data: {
        id: 'test-1',
        advice: 'Test advice',
        module_sample_link: '',
        consent_required: false,
      },
    });

    render(<TeacherChat mockMode={false} />);
    
    const input = screen.getByPlaceholderText(/Describe the classroom problem in one sentence/);
    fireEvent.change(input, { target: { value: 'Test problem' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(teacherApi.createTeacherQuery).toHaveBeenCalled();
    });
  });
});
