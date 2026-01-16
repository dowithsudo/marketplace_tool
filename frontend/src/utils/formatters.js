/**
 * Format number to IDR currency with 0 decimal places.
 * Example: 15250.98 -> "Rp 15.251"
 * @param {number|string} value - The value to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "Rp 0";
  const num = parseFloat(value);
  if (isNaN(num)) return "Rp 0";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Format decimal value to percentage string.
 * Use this when the value is 0.15 (decimal) and you want "15,00%"
 * @param {number|string} value - The decimal value (e.g. 0.15)
 * @returns {string} Formatted percentage string
 */
export const formatDecimalPercent = (value) => {
  if (value === null || value === undefined || value === "") return "0%";
  const num = parseFloat(value);
  if (isNaN(num)) return "0%";

  return new Intl.NumberFormat("id-ID", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Format raw number to percentage string without multiplying.
 * Use this when value is already 15 (percent) and you want "15,00%"
 * @param {number|string} value - The raw percent value (e.g. 15.5)
 * @returns {string} Formatted percentage string
 */
export const formatRawPercent = (value) => {
  if (value === null || value === undefined || value === "") return "0%";
  const num = parseFloat(value);
  if (isNaN(num)) return "0%";

  return (
    num.toLocaleString("id-ID", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }) + "%"
  );
};

/**
 * Format generic number with standard decimals.
 * @param {number|string} value
 * @param {number} minDecimals
 * @param {number} maxDecimals
 * @returns {string}
 */
export const formatNumber = (value, minDecimals = 0, maxDecimals = 2) => {
  if (value === null || value === undefined || value === "") return "0";
  const num = parseFloat(value);
  if (isNaN(num)) return "0";

  return num.toLocaleString("id-ID", {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });
};
