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