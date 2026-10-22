import { render, screen } from '@testing-library/react';
import { getHealth } from '../../api/health.api';
import { ApiStatus } from './ApiStatus';

vi.mock('../../api/health.api', () => ({ getHealth: vi.fn() }));

describe('ApiStatus', () => {
  it('shows online when the health check succeeds', async () => {
    vi.mocked(getHealth).mockResolvedValue({ status: 'ok', database: 'up', uptimeSeconds: 5 });
    render(<ApiStatus />);
    expect(await screen.findByText(/api online/i)).toBeInTheDocument();
  });

  it('shows offline when the health check fails', async () => {
    vi.mocked(getHealth).mockRejectedValue(new Error('down'));
    render(<ApiStatus />);
    expect(await screen.findByText(/api offline/i)).toBeInTheDocument();
  });
});
