'use client'

const PREFIJOS = [
  { value: 'V', title: 'Venezolano/a' },
  { value: 'E', title: 'Extranjero/a' },
  { value: 'J', title: 'Jurídico (empresa)' },
  { value: 'P', title: 'Pasaporte' },
  { value: 'G', title: 'Gubernamental' },
]

function formatNumero(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function parseValue(value: string): { prefix: string; numero: string } {
  const match = value.match(/^([VEJPG])-?(.*)$/)
  if (match) return { prefix: match[1], numero: match[2] }
  return { prefix: 'V', numero: formatNumero(value) }
}

interface Props {
  value: string
  onChange: (val: string) => void
  className?: string
  required?: boolean
}

export default function CedulaInput({ value, onChange, className = '', required }: Props) {
  const { prefix, numero } = parseValue(value)
  const stripped = className.replace('w-full', '').trim()
  const inputCls = className.replace('w-full', 'flex-1').trim()

  function handlePrefixChange(newPrefix: string) {
    onChange(numero ? `${newPrefix}-${numero}` : '')
  }

  function handleNumeroChange(raw: string) {
    const formatted = formatNumero(raw)
    onChange(formatted ? `${prefix}-${formatted}` : '')
  }

  return (
    <div className="flex gap-1.5">
      <select
        value={prefix}
        onChange={e => handlePrefixChange(e.target.value)}
        aria-label="Tipo de documento"
        className={`${stripped} w-16 shrink-0 cursor-pointer`}
      >
        {PREFIJOS.map(p => (
          <option key={p.value} value={p.value} title={p.title}>
            {p.value}
          </option>
        ))}
      </select>
      <input
        type="text"
        inputMode="numeric"
        required={required}
        placeholder="12.345.678"
        value={numero}
        onChange={e => handleNumeroChange(e.target.value)}
        className={inputCls}
      />
    </div>
  )
}
