import type { HTMLAttributes, ReactNode, TdHTMLAttributes } from 'react';
import './Table.css';

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="table-wrap">{children}</div>;
}

/** A row that opens something on click — the app's one interaction pattern
 * for lists (see APP_FLOW.md §3): click the row, get a detail view. No
 * trailing "Actions" column; the trailing chevron cell is added
 * automatically so callers never forget it. */
export function ClickableRow({
  onClick,
  children,
  ...rest
}: HTMLAttributes<HTMLTableRowElement> & { onClick: () => void }) {
  return (
    <tr
      className="row-click"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      {...rest}
    >
      {children}
      <td className="chev">&rsaquo;</td>
    </tr>
  );
}

export function NumCell({ children, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className="num" {...rest}>
      {children}
    </td>
  );
}
