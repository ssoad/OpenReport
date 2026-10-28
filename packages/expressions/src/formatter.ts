export function formatNumber(
  value: number,
  pattern?: string,
  decimals: number = 2
): string {
  if (isNaN(value) || value === null || value === undefined) return '';

  if (pattern) {
    // If pattern contains comma e.g. "#,##0.00"
    const hasComma = pattern.includes(',');
    const parts = value.toFixed(decimals).split('.');
    const integerPart = hasComma ? parts[0]!.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : parts[0]!;
    return parts.length > 1 && decimals > 0 ? `${integerPart}.${parts[1]}` : integerPart;
  }

  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatCurrency(
  value: number,
  currencyCode: string = 'USD',
  decimals: number = 2
): string {
  if (isNaN(value) || value === null || value === undefined) return '';

  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatPercent(value: number, decimals: number = 1): string {
  if (isNaN(value) || value === null || value === undefined) return '';

  return (value * 100).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }) + '%';
}

export function formatDate(dateInput: Date | string | number, formatStr: string = 'YYYY-MM-DD'): string {
  if (!dateInput) return '';

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  const pad = (n: number) => n.toString().padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  let res = formatStr;
  res = res.replace(/YYYY/g, year.toString());
  res = res.replace(/YY/g, year.toString().slice(-2));
  res = res.replace(/MMMM/g, fullMonthNames[month - 1]!);
  res = res.replace(/MMM/g, monthNames[month - 1]!);
  res = res.replace(/MM/g, pad(month));
  res = res.replace(/M/g, month.toString());
  res = res.replace(/DD/g, pad(day));
  res = res.replace(/D/g, day.toString());
  res = res.replace(/HH/g, pad(hours));
  res = res.replace(/H/g, hours.toString());
  res = res.replace(/mm/g, pad(minutes));
  res = res.replace(/m/g, minutes.toString());
  res = res.replace(/ss/g, pad(seconds));
  res = res.replace(/s/g, seconds.toString());

  return res;
}
