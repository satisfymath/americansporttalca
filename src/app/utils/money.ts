// Money formatting utilities

// Format number as CLP currency
export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format number with thousands separator
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-CL').format(num)
}
