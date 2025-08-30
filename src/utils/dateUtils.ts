// Utility functions for date handling in Brazilian timezone

/**
 * Gets the current date in São Paulo/Brazil timezone formatted as YYYY-MM-DD
 * @returns String date in YYYY-MM-DD format for Brazilian timezone
 */
export function getBrazilianDateString(): string {
  const brazilDate = new Date().toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // Convert from DD/MM/YYYY to YYYY-MM-DD
  const [day, month, year] = brazilDate.split('/');
  return `${year}-${month}-${day}`;
}

/**
 * Gets the current date as a Date object in Brazilian timezone
 * @returns Date object representing current time in Brazilian timezone
 */
export function getBrazilianDate(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

/**
 * Formats a date string (YYYY-MM-DD) to Brazilian format (DD/MM/YYYY)
 * Handles timezone issues by parsing the date correctly
 * @param dateString Date in YYYY-MM-DD format
 * @returns Formatted date string in DD/MM/YYYY format
 */
export function formatDateToBrazilian(dateString: string): string {
  if (!dateString) return '';
  
  // Parse the date string as local date to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  
  return date.toLocaleDateString('pt-BR');
}