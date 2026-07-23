// Shared parsing of axios errors from this API, so the 422 / message /
// fallback logic lives in one place instead of being copy-pasted into every
// form. The API returns Laravel's validation shape on 422
// ({ message, errors: { field: [msg] } }) and a bare { message } for
// hand-rolled business-rule rejections.

const DEFAULT_FALLBACK = "Something went wrong. Please try again.";

// For forms that render per-field errors plus a general error line.
// Returns { fieldErrors, message } where exactly one side is meaningful:
// fieldErrors is the 422 errors object (or null), message is a general
// string when there are no per-field errors (or null when there are).
export function parseApiError(err, fallback = DEFAULT_FALLBACK) {
  const data = err.response?.data;
  if (err.response?.status === 422 && data?.errors) {
    return { fieldErrors: data.errors, message: null };
  }
  return { fieldErrors: null, message: data?.message || fallback };
}

// For screens that show a single error line — flattens the first per-field
// 422 message when present, otherwise the general message or the fallback.
export function getApiErrorMessage(err, fallback = DEFAULT_FALLBACK) {
  const data = err.response?.data;
  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first) && first.length) {
      return first[0];
    }
  }
  return data?.message || fallback;
}
