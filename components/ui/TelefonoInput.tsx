'use client'

function formatTelefono(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''
  if (digits.length <= 4) return `(${digits}`
  if (digits.length <= 7) return `(${digits.slice(0, 4)}) ${digits.slice(4)}`
  return `(${digits.slice(0, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
}

interface Props {
  value: string
  onChange: (val: string) => void
  className?: string
  required?: boolean
  placeholder?: string
}

export default function TelefonoInput({
  value, onChange, className = '', required, placeholder = '(0412) 456-7899',
}: Props) {
  return (
    <input
      type="tel"
      inputMode="numeric"
      required={required}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(formatTelefono(e.target.value))}
      className={className}
    />
  )
}
