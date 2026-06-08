export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

export function validatePrice(price: any): boolean {
  const num = parseFloat(price);
  return !isNaN(num) && num > 0 && num < 1_000_000;
}

export function validateProductName(name: string): boolean {
  return typeof name === 'string' && name.trim().length > 0 && name.length < 255;
}