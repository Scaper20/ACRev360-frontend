interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function DataTable<T>({ columns, rows, rowKey, onRowClick, emptyMessage = "Nothing here yet." }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.header}>{col.header}</th>
            ))}
            {onRowClick && <th></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className={onRowClick ? "row-click" : ""} onClick={() => onRowClick?.(row)}>
              {columns.map((col) => (
                <td key={col.header} className={col.className}>
                  {col.render(row)}
                </td>
              ))}
              {onRowClick && <td className="chev">›</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
