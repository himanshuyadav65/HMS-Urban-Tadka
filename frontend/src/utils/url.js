/**
 * Centralized URL configuration & Asset URL Resolver
 * 
 * Environment variables:
 * - VITE_BACKEND_URL: Base URL of backend server (e.g. 'http://localhost:5000' or 'https://api.myhotel.com')
 * - VITE_API_URL: Full API URL (e.g. 'http://localhost:5000/api' or '/api')
 */

// Base URL of backend server without trailing slash
export const BACKEND_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : '') ||
  ''
).replace(/\/+$/, '');

// API Base URL (used by Axios)
export const API_URL = (
  import.meta.env.VITE_API_URL ||
  (BACKEND_URL ? `${BACKEND_URL}/api` : '/api')
).replace(/\/+$/, '');

/**
 * Resolves static asset and upload paths (avatars, room images, kyc proofs, attachments).
 * 
 * - If given an external URL (http://, https://, data:, blob:), returns it unchanged.
 * - If given a relative path (e.g. '/uploads/...'), prepends BACKEND_URL.
 * - If empty/null, returns empty string.
 * 
 * @param {string} path - Image or document path
 * @returns {string} Fully qualified URL or relative path
 */
export const getAssetUrl = (path) => {
  if (!path || typeof path !== 'string') return '';
  
  const trimmed = path.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return BACKEND_URL ? `${BACKEND_URL}${cleanPath}` : cleanPath;
};

export default {
  BACKEND_URL,
  API_URL,
  getAssetUrl,
};
