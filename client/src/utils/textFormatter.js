/**
 * Text formatting utilities for consistent data display
 */

/**
 * Format text to Title Case (First Letter Capitalized)
 * Example: "rama lokesh reddy" -> "Rama Lokesh Reddy"
 * @param {string} text - Input text
 * @returns {string} - Formatted text
 */
export const toTitleCase = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format name consistently
 * @param {string} name - Input name
 * @returns {string} - Formatted name
 */
export const formatName = (name) => {
  return toTitleCase(name);
};

/**
 * Format department name consistently (UPPERCASE)
 * @param {string} dept - Department name
 * @returns {string} - Formatted department in UPPERCASE
 */
export const formatDepartment = (dept) => {
  if (!dept || typeof dept !== 'string') return dept;
  return dept.toUpperCase();
};

/**
 * Format section consistently (uppercase)
 * @param {string} section - Section
 * @returns {string} - Formatted section
 */
export const formatSection = (section) => {
  if (!section || typeof section !== 'string') return section;
  return section.toUpperCase();
};
