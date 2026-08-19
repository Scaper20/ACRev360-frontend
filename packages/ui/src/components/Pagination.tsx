import './Pagination.css';

export const PAGE_SIZE = 50;

export interface PaginationProps {
  page: number;
  count: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
}

/** Every list endpoint in this API paginates at PAGE_SIZE — this renders the
 * "Showing X–Y of Z" + Prev/Next strip a page needs to reach anything past
 * the first page. Renders nothing when everything already fits on one page,
 * so pages with few rows don't grow a pointless empty footer. */
export function Pagination({ page, count, onPageChange, pageSize = PAGE_SIZE }: PaginationProps) {
  if (count <= pageSize) return null;

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);

  return (
    <div className="pagination">
      <span>
        Showing {from}–{to} of {count}
      </span>
      <div className="pagination-buttons">
        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
