// twoFactorService.js (corrected to use ES modules)
export function generate2FACode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}