import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Settings from './Settings';
import { readAuthSession } from '@/features/auth/infrastructure/session/authSessionStorage';
import { getViabilityPolicy, updateViabilityPolicy } from '@/features/settings/infrastructure/viabilityPolicyApi';
import { ApiError } from '@/shared/infrastructure/http/apiClient';

vi.mock('@/shared/presentation/layouts/Sidebar', () => ({ default: () => null }));
vi.mock('@/features/auth/infrastructure/session/authSessionStorage', () => ({
  readAuthSession: vi.fn(),
  saveAuthSession: vi.fn(),
}));
vi.mock('@/features/settings/infrastructure/viabilityPolicyApi', () => ({
  getViabilityPolicy: vi.fn(),
  updateViabilityPolicy: vi.fn(),
}));

const first = {
  identifier: 'via-policy',
  version: '1',
  conditional_from: 40,
  viable_from: 70,
  default_configuration: { conditional_from: 40, viable_from: 70 },
};
const second = { ...first, version: '2', conditional_from: 45, viable_from: 75 };

beforeEach(() => {
  vi.mocked(readAuthSession).mockReturnValue({
    accessToken: 'test-token', tokenType: 'bearer', expiresInSeconds: 3600,
    expiresAt: '', user: { id: 'admin-id', email: 'admin@example.com', role: 'admin' },
  });
  vi.mocked(getViabilityPolicy).mockResolvedValue(first);
  vi.mocked(updateViabilityPolicy).mockResolvedValue(second);
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('viability settings', () => {
  it('loads the effective policy and keeps restore local until save', async () => {
    vi.mocked(getViabilityPolicy).mockResolvedValue(second);
    render(<Settings navigate={vi.fn()} />);
    expect(screen.getByRole('status').textContent).toContain('Cargando');
    const fields = await screen.findAllByRole('spinbutton');
    expect((fields[0] as HTMLInputElement).value).toBe('75');
    expect((fields[1] as HTMLInputElement).value).toBe('45');
    fireEvent.click(screen.getByRole('button', { name: /Restaurar por defecto/i }));
    expect((fields[0] as HTMLInputElement).value).toBe('70');
    expect((fields[1] as HTMLInputElement).value).toBe('40');
    expect(updateViabilityPolicy).not.toHaveBeenCalled();
  });

  it('saves thresholds with the read version and replaces it with the response', async () => {
    render(<Settings navigate={vi.fn()} />);
    const fields = await screen.findAllByRole('spinbutton');
    fireEvent.change(fields[0], { target: { value: '75' } });
    fireEvent.change(fields[1], { target: { value: '45' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar umbrales/i }));
    await waitFor(() => expect(updateViabilityPolicy).toHaveBeenCalledWith(first, 45, 75));
    await screen.findByText(/Umbrales guardados/);
    expect((fields[0] as HTMLInputElement).value).toBe('75');
    expect((fields[1] as HTMLInputElement).value).toBe('45');
  });

  it('shows a conflict and loads the newer server policy', async () => {
    vi.mocked(getViabilityPolicy).mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    vi.mocked(updateViabilityPolicy).mockRejectedValue(new ApiError('Conflict', 409));
    render(<Settings navigate={vi.fn()} />);
    const fields = await screen.findAllByRole('spinbutton');
    fireEvent.click(screen.getByRole('button', { name: /Guardar umbrales/i }));
    await screen.findByText(/Tus umbrales cambiaron en otra sesión/);
    expect(getViabilityPolicy).toHaveBeenCalledTimes(2);
    expect((fields[0] as HTMLInputElement).value).toBe('75');
    expect((fields[1] as HTMLInputElement).value).toBe('45');
  });

  it('lets USER edit and save personal thresholds', async () => {
    vi.mocked(readAuthSession).mockReturnValue({
      accessToken: 'test-token', tokenType: 'bearer', expiresInSeconds: 3600,
      expiresAt: '', user: { id: 'user-id', email: 'user@example.com', role: 'user' },
    });
    render(<Settings navigate={vi.fn()} />);
    const fields = await screen.findAllByRole('spinbutton');
    expect((fields[0] as HTMLInputElement).disabled).toBe(false);
    fireEvent.change(fields[0], { target: { value: '75' } });
    fireEvent.change(fields[1], { target: { value: '45' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar umbrales/i }));
    await waitFor(() => expect(updateViabilityPolicy).toHaveBeenCalledWith(first, 45, 75));
    await screen.findByText('Umbrales guardados para tus próximas evaluaciones.');
  });

  it('shows validation and permission errors', async () => {
    vi.mocked(updateViabilityPolicy).mockRejectedValue(new ApiError('Denied', 403));
    render(<Settings navigate={vi.fn()} />);
    const fields = await screen.findAllByRole('spinbutton');
    fireEvent.change(fields[1], { target: { value: '70' } });
    expect(screen.getByText(/debe ser menor/)).toBeTruthy();
    expect((screen.getByRole('button', { name: /Guardar umbrales/i }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(fields[1], { target: { value: '45' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar umbrales/i }));
    await screen.findByText(/falta de permisos/);
  });

  it('disables save during the request and displays a server validation error', async () => {
    let rejectSave: ((reason: Error) => void) | undefined;
    vi.mocked(updateViabilityPolicy).mockImplementation(() => new Promise((_, reject) => {
      rejectSave = reject;
    }));
    render(<Settings navigate={vi.fn()} />);
    await screen.findAllByRole('spinbutton');
    fireEvent.click(screen.getByRole('button', { name: /Guardar umbrales/i }));
    const saving = screen.getByRole('button', { name: /Guardando/i }) as HTMLButtonElement;
    expect(saving.disabled).toBe(true);
    rejectSave?.(new ApiError('Umbrales inválidos', 422));
    await screen.findByText('Umbrales inválidos');
  });
});
