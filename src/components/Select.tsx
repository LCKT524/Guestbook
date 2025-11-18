import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

type Props = React.SelectHTMLAttributes<HTMLSelectElement>

const Select = forwardRef<HTMLSelectElement, Props>(function Select(props, ref) {
  const { className, children, ...rest } = props
  return (
    <div className="relative">
      <select
        ref={ref}
        {...rest}
        className={`w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${className || ''}`}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  )
})

export default Select