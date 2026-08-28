// ---------------------------------------------------------------------------
// AppSelector — dropdown to pick an existing JobApplication.
// Used by JDParserPanel, PrepPackPanel, and FollowUpPanel.
// ---------------------------------------------------------------------------
import type { JobApplication } from '@/types'

interface AppSelectorProps {
  applications: JobApplication[]
  value: string        // '' = no selection
  onChange: (appId: string) => void
  label?: string
  required?: boolean
  placeholder?: string
}

export function AppSelector({
  applications,
  value,
  onChange,
  label = 'Application',
  required = false,
  placeholder = 'Select an application…',
}: AppSelectorProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
        {required && <span className="text-danger-500 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
      >
        <option value="">{placeholder}</option>
        {applications.map(app => (
          <option key={app.id} value={app.id}>
            {app.roleName} @ {app.companyName}
          </option>
        ))}
      </select>
    </div>
  )
}
