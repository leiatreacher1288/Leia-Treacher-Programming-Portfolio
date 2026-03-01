// src/api/auth.ts
import axiosInstance from './axiosInstance';
import axios from 'axios';

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface RegisterPayload {
  email: string;
  name: string;
  password: string;
}

interface RegisterResponse {
  access: string;
  refresh: string;
  message: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  access: string;
  refresh: string;
}

/** Simple `{ message }` wrapper used by most status-only endpoints */
interface SimpleMsg {
  message: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/* -------------------------------------------------------------------------- */
/*                               Auth endpoints                               */
/* -------------------------------------------------------------------------- */

export const registerInstructor = async (
  data: RegisterPayload
): Promise<
  { success: true; data: RegisterResponse } | { success: false; error: string }
> => {
  try {
    const res = await axiosInstance.post<RegisterResponse>(
      '/auth/register/',
      data
    );
    return { success: true, data: res.data };
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const body = err.response?.data as {
        message?: string;
        error?: string;
        email?: string[];
      };

      const errorMsg =
        body.message ||
        body.error ||
        (Array.isArray(body.email) && body.email[0]) ||
        'Registration failed';

      return { success: false, error: errorMsg };
    }
    return { success: false, error: 'An unknown error occurred' };
  }
};

export const loginUser = async (
  data: LoginPayload
): Promise<
  { success: true; data: LoginResponse } | { success: false; error: string }
> => {
  try {
    const res = await axiosInstance.post<LoginResponse>('/auth/token/', data);
    return { success: true, data: res.data };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Invalid credentials',
      };
    }
    return { success: false, error: 'An unknown error occurred' };
  }
};

export const verifyEmail = async (
  token: string
): Promise<
  { success: true; data: SimpleMsg } | { success: false; error: string }
> => {
  try {
    const res = await axiosInstance.post<SimpleMsg>('/auth/verify-email/', {
      token,
    });
    return { success: true, data: res.data };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.message || 'Verification failed',
      };
    }
    return { success: false, error: 'An unknown error occurred' };
  }
};

export const forgotPassword = async (
  email: string
): Promise<{ success: true } | { success: false; error: string }> => {
  try {
    await axiosInstance.post('/auth/forgot-password/', { email });
    return { success: true };
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to send reset email',
      };
    }
    return { success: false, error: 'Network error occurred' };
  }
};

export const validateResetToken = async (
  uid: string,
  token: string
): Promise<
  | { success: true; data: { valid: boolean; email: string } }
  | { success: false; error: string }
> => {
  try {
    const res = await axiosInstance.post('/auth/validate-reset-token/', {
      uid,
      token,
    });
    return { success: true, data: res.data };
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return {
        success: false,
        error: err.response?.data?.message || 'Invalid token',
      };
    }
    return { success: false, error: 'Network error occurred' };
  }
};

/* -------------------------------------------------------------------------- */
/*                        Password reset / change endpoints                    */
/* -------------------------------------------------------------------------- */

export const resetPassword = async (
  uid: string,
  token: string,
  newPassword: string
): Promise<
  { success: true; data: SimpleMsg } | { success: false; error: string }
> => {
  try {
    const res = await axiosInstance.post<SimpleMsg>('/auth/reset-password/', {
      uid,
      token,
      new_password: newPassword,
    });
    return { success: true, data: res.data };
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to reset password',
      };
    }
    return { success: false, error: 'Network error occurred' };
  }
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<
  { success: true; data: SimpleMsg } | { success: false; error: string }
> => {
  try {
    const res = await axiosInstance.post<SimpleMsg>('/auth/change-password/', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return { success: true, data: res.data };
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to change password',
      };
    }
    return { success: false, error: 'Network error occurred' };
  }
};
