/**
 * Currency and locale formatting for Qatar (QAR)
 */

export function formatQAR(amount: number): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  return `QAR ${safeAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatQARCompact(amount: number): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  return `QAR ${safeAmount.toFixed(2)}`;
}
