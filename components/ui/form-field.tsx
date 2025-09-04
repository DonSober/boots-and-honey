import { forwardRef } from 'react'

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div>
        <label className="text-sm font-medium px-px text-[rgba(77,84,97,1)]">
          {label}
        </label>
        <input
          ref={ref}
          className={`mt-1 w-full h-[40px] px-3 py-2 text-sm text-[rgba(77,84,97,1)] font-normal border border-gray-300 rounded-md focus:outline-[0.5px] focus:outline-blue-600 pointer-events-auto ${className || ''}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

export { FormField }