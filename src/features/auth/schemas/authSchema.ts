import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required.',
      invalid_type_error: 'Email must be a text string.',
    })
    .min(1, { message: 'Email is required.' })
    .email({ message: 'Please enter a valid email address.' }),
});

export const loginSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required.',
      invalid_type_error: 'Email must be a text string.',
    })
    .min(1, { message: 'Email is required.' })
    .email({ message: 'Please enter a valid email address.' }),

  password: z
    .string({
      required_error: 'Password is required.',
      invalid_type_error: 'Password must be a text string.',
    })
    .min(6, { message: 'Password must be at least 6 characters long.' }),
});

export const signupSchema = z
  .object({
    email: z
      .string({
        required_error: 'Email is required.',
        invalid_type_error: 'Email must be a text string.',
      })
      .min(1, { message: 'Email is required.' })
      .email({ message: 'Please enter a valid email address.' }),

    password: z
      .string({
        required_error: 'Password is required.',
        invalid_type_error: 'Password must be a text string.',
      })
      .min(6, { message: 'Password must be at least 6 characters long.' }),

    confirmPassword: z
      .string({
        required_error: 'Please confirm your password.',
        invalid_type_error: 'Confirm password must be a text string.',
      })
      .min(6, {
        message: 'Confirm password must be at least 6 characters long.',
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const newPasswordSchema = z
  .object({
    newPassword: z
      .string({
        required_error: 'New password is required.',
        invalid_type_error: 'Password must be a text string.',
      })
      .min(6, { message: 'Password must be at least 6 characters long.' }),

    confirmNewPassword: z
      .string({
        required_error: 'Please confirm your new password.',
        invalid_type_error: 'Password must be a text string.',
      })
      .min(6, {
        message: 'Confirm password must be at least 6 characters long.',
      }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match.',
    path: ['confirmNewPassword'],
  });
