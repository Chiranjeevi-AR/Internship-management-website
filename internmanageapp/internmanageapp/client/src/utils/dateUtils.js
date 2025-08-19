/**
 * Date utilities for handling local time consistently across the application
 */

/**
 * Get today's date in YYYY-MM-DD format using local time
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export const getTodayLocalDate = () => {
  const today = new Date();
  return today.getFullYear() + '-' + 
         String(today.getMonth() + 1).padStart(2, '0') + '-' + 
         String(today.getDate()).padStart(2, '0');
};

/**
 * Format a date to YYYY-MM-DD using local time
 * @param {Date} date - The date to format
 * @returns {string} Date in YYYY-MM-DD format
 */
export const formatDateToLocal = (date) => {
  const d = new Date(date);
  return d.getFullYear() + '-' + 
         String(d.getMonth() + 1).padStart(2, '0') + '-' + 
         String(d.getDate()).padStart(2, '0');
};

/**
 * Get current date and time in local timezone
 * @returns {Date} Current date and time
 */
export const getCurrentLocalDateTime = () => {
  return new Date();
};

/**
 * Check if a date is today (using local time)
 * @param {string|Date} date - The date to check
 * @returns {boolean} True if the date is today
 */
export const isToday = (date) => {
  const today = getTodayLocalDate();
  const checkDate = typeof date === 'string' ? date.slice(0, 10) : formatDateToLocal(date);
  return checkDate === today;
};
