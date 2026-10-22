import { AxiosError, AxiosHeaders } from 'axios';
import { getErrorMessage } from './errors';

const axiosErrorWith = (message: string | string[]) =>
  new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    data: { message },
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

describe('getErrorMessage', () => {
  it('uses the message sent by the API', () => {
    expect(getErrorMessage(axiosErrorWith('Email already registered'))).toBe(
      'Email already registered',
    );
  });

  it('joins validation messages', () => {
    expect(getErrorMessage(axiosErrorWith(['email must be an email', 'password is too short']))).toBe(
      'email must be an email, password is too short',
    );
  });

  it('explains network failures', () => {
    expect(getErrorMessage(new AxiosError('Network Error', 'ERR_NETWORK'))).toMatch(
      /cannot reach the server/i,
    );
  });

  it('falls back for unknown values', () => {
    expect(getErrorMessage(42)).toBe('Something went wrong.');
  });
});
