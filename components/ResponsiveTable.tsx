"use client";

// Generic responsive table that collapses to cards on mobile
interface Column<T> {
  label: string;
  key?: keyof T;
  render?: (row: T) => React.ReactNode;
  className?: string;
  mobileHide?: boolean; // hide this column in the card label on mobile
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  actions?: (row: T) => React.ReactNode;
}

export default function ResponsiveTable<T>({ columns, data, keyField, actions }: Props<T>) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={`text-left px-6 py-3 font-medium text-gray-600 ${col.className ?? ""}`}>
                  {col.label}
                </th>
              ))}
              {actions && <th className="text-right px-6 py-3 font-medium text-gray-600">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((row) => (
              <tr key={String(row[keyField])} className="hover:bg-gray-50 transition-colors">
                {columns.map((col, i) => (
                  <td key={i} className={`px-6 py-3 text-gray-700 ${col.className ?? ""}`}>
                    {col.render ? col.render(row) : String(row[col.key!] ?? "—")}
                  </td>
                ))}
                {actions && <td className="px-6 py-3 text-right">{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {data.map((row) => (
          <div key={String(row[keyField])} className="p-4">
            {columns.filter((c) => !c.mobileHide).map((col, i) => (
              <div key={i} className="flex items-start justify-between py-0.5">
                <span className="text-xs text-gray-400 w-24 shrink-0">{col.label}</span>
                <span className="text-xs text-gray-800 text-right flex-1 ml-2">
                  {col.render ? col.render(row) : String(row[col.key!] ?? "—")}
                </span>
              </div>
            ))}
            {actions && (
              <div className="flex justify-end gap-3 mt-3 pt-2 border-t border-gray-50">
                {actions(row)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
