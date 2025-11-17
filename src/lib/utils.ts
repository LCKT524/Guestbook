import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function normalizePhone(input: string) {
  const raw = String(input || '').trim()
  const digits = raw.replace(/[^0-9]/g, '')
  if (digits.length > 11) {
    const tail11 = digits.slice(-11)
    return tail11
  }
  return digits
}
export function isValidCNMobile(phone: string) {
  return /^1[3-9]\d{9}$/.test(phone)
}
export function validatePhone(input: string) {
  const value = normalizePhone(input)
  if (!isValidCNMobile(value)) {
    return { ok: false, error: '手机号格式不正确', value }
  }
  return { ok: true, value }
}
