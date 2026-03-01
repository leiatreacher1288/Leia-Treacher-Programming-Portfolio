import { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerInstructor } from '../api/auth';

// Validator functions
const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateName = (name: string) => /^[A-Za-z]+$/.test(name);
const validatePassword = (password: string) =>
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-[\]{};':"\\|,.<>/?]).{8,}$/.test(
    password
  );

const hasUppercase = (str: string) => /[A-Z]/.test(str);
const hasLowercase = (str: string) => /[a-z]/.test(str);
const hasNumber = (str: string) => /\d/.test(str);
const hasSpecialChar = (str: string) =>
  /[!@#$%^&*()_+\-[\]{};':"\\|,.<>/?]/.test(str);

const isLongEnough = (str: string) => str.length >= 8;

const allPasswordCriteriaMet = (password: string) =>
  isLongEnough(password) &&
  hasUppercase(password) &&
  hasLowercase(password) &&
  hasNumber(password) &&
  hasSpecialChar(password);

interface ExtendedUserModel {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const Signup = () => {
  const [data, setData] = useState<ExtendedUserModel>({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setData((prev) => ({ ...prev, [id]: value }));
    setError('');
    setSuccess('');

    let errorMsg = '';

    switch (id) {
      case 'firstname':
      case 'lastname':
        if (value && !validateName(value)) {
          errorMsg = 'Must contain only letters with no spaces.';
        }
        break;
      case 'email':
        if (value && !validateEmail(value)) {
          errorMsg = 'Invalid email format.';
        }
        break;
      case 'password':
        if (value && !validatePassword(value)) {
          errorMsg = 'Password must contain the following criteria:';
        }
        break;

      case 'confirmPassword':
        if (value !== data.password) {
          errorMsg = 'Passwords do not match.';
        }
        break;
    }

    setFieldErrors((prev) => ({ ...prev, [id]: errorMsg }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const { firstname, lastname, email, password, confirmPassword } = data;

    if (!firstname || !lastname || !email || !password || !confirmPassword) {
      setError('Please fill all fields.');
      setLoading(false);
      return;
    }

    if (!validateName(firstname) || !validateName(lastname)) {
      setError('First and last name must contain only letters.');
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError('Invalid email format.');
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError(
        'Password must include 1 uppercase letter, 1 digit, 1 special character and be at least 8 characters.'
      );
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    // Backend integration
    const response = await registerInstructor({
      email,
      password,
      name: `${firstname.trim()} ${lastname.trim()}`, // ← COMBINE into a single `name` field
    });

    if (response.success) {
      setSuccess(
        'A verification email has been sent to your email address. Please verify your account within 3 days or it will be locked.'
      );
      setData({
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    } else {
      // Handle specific error messages
      if (
        response.error.toLowerCase().includes('already exists') ||
        response.error.toLowerCase().includes('already registered')
      ) {
        setError(
          'This email is already registered. Please use a different email or login.'
        );
      } else {
        setError(response.error);
      }
    }

    setLoading(false);

    // Hide the success message after 30 seconds
    if (response.success) {
      setTimeout(() => {
        setSuccess('');
      }, 30000);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#E4F6F8] dark:bg-[#0D1B1E] flex items-center justify-center p-4">
      <div
        className="w-full max-w-md bg-blue-100 dark:bg-[#15202B] text-black dark:text-white rounded-lg shadow-xl ring-4 ring-blue-300 dark:ring-cyan-400 dark:shadow-cyan-500/20 p-8 animate-glow-slow"
        style={
          {
            '--glow-color': '#60a5fa',
            colorScheme: 'light dark',
          } as React.CSSProperties
        }
      >
        <h1 className="text-3xl font-bold mb-6 text-center">Sign Up</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {['firstname', 'lastname'].map((field) => (
              <div key={field}>
                <label
                  htmlFor={field}
                  className="block text-sm font-medium mb-1 capitalize"
                >
                  {field === 'firstname' ? 'First Name' : 'Last Name'}
                </label>
                <input
                  type="text"
                  id={field}
                  value={data[field as keyof ExtendedUserModel]}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded bg-white dark:bg-gray-900 text-black dark:text-white ${
                    fieldErrors[field] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {fieldErrors[field] && (
                  <p className="text-red-500 text-sm">{fieldErrors[field]}</p>
                )}
              </div>
            ))}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={data.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded bg-white dark:bg-gray-900 text-black dark:text-white ${
                fieldErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-sm">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={data.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded bg-white dark:bg-gray-900 text-black dark:text-white ${
                fieldErrors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {fieldErrors.password && (
              <p className="text-red-500 text-sm whitespace-pre-line mt-1">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {data.password && !allPasswordCriteriaMet(data.password) && (
            <ul className="text-sm mt-2 space-y-1">
              <li
                className={
                  isLongEnough(data.password)
                    ? 'text-green-600'
                    : 'text-red-500'
                }
              >
                {isLongEnough(data.password) ? '✓' : '✗'} At least 8 characters
                long
              </li>
              <li
                className={
                  hasUppercase(data.password)
                    ? 'text-green-600'
                    : 'text-red-500'
                }
              >
                {hasUppercase(data.password) ? '✓' : '✗'} At least 1 uppercase
                letter (A-Z)
              </li>
              <li
                className={
                  hasLowercase(data.password)
                    ? 'text-green-600'
                    : 'text-red-500'
                }
              >
                {hasLowercase(data.password) ? '✓' : '✗'} At least 1 lowercase
                letter (a-z)
              </li>
              <li
                className={
                  hasNumber(data.password) ? 'text-green-600' : 'text-red-500'
                }
              >
                {hasNumber(data.password) ? '✓' : '✗'} At least 1 number (0-9)
              </li>
              <li
                className={
                  hasSpecialChar(data.password)
                    ? 'text-green-600'
                    : 'text-red-500'
                }
              >
                {hasSpecialChar(data.password) ? '✓' : '✗'} At least 1 special
                character (!@#$...)
              </li>
            </ul>
          )}

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium mb-1"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={data.confirmPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded bg-white dark:bg-gray-900 text-black dark:text-white ${
                fieldErrors.confirmPassword
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              required
            />
            {fieldErrors.confirmPassword && (
              <p className="text-red-500 text-sm">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-4 text-sm text-center text-gray-700 dark:text-gray-300">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};
