import React from 'react';

export const Table = React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
      <table ref={ref} className={`w-full text-left text-sm text-slate-700 ${className}`} {...props}>
        {children}
      </table>
    </div>
  )
);
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className = '', children, ...props }, ref) => (
  <thead
    ref={ref}
    className={`border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500 ${className}`}
    {...props}
  >
    {children}
  </thead>
));
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className = '', children, ...props }, ref) => (
  <tbody ref={ref} className={`divide-y divide-slate-100 ${className}`} {...props}>
    {children}
  </tbody>
));
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className = '', children, ...props }, ref) => (
    <tr
      ref={ref}
      className={`transition-colors hover:bg-slate-50/60 focus:bg-slate-50/80 ${className}`}
      {...props}
    >
      {children}
    </tr>
  )
);
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className = '', children, ...props }, ref) => (
  <th ref={ref} className={`px-4 py-3 font-semibold text-slate-700 ${className}`} {...props}>
    {children}
  </th>
));
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className = '', children, ...props }, ref) => (
  <td ref={ref} className={`px-4 py-3.5 align-middle text-slate-700 ${className}`} {...props}>
    {children}
  </td>
));
TableCell.displayName = 'TableCell';

export const TableEmpty: React.FC<{ message?: string; icon?: React.ReactNode }> = ({
  message = 'No data available',
  icon,
}) => (
  <tr>
    <td colSpan={100} className="px-6 py-12 text-center text-slate-400">
      <div className="flex flex-col items-center justify-center gap-2">
        {icon && <div className="text-slate-300">{icon}</div>}
        <p className="text-sm font-medium text-slate-500">{message}</p>
      </div>
    </td>
  </tr>
);
