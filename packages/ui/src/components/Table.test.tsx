import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ClickableRow } from './Table';

// ClickableRow's keyboard handling is a deliberate improvement over the
// original prototype (which had click-only rows, no keyboard access at
// all) — regression-test it directly rather than trust it stays correct.
describe('ClickableRow', () => {
  function renderRow(onClick: () => void) {
    return render(
      <table>
        <tbody>
          <ClickableRow onClick={onClick}>
            <td>Row content</td>
          </ClickableRow>
        </tbody>
      </table>,
    );
  }

  it('is focusable and exposes a button role', () => {
    renderRow(vi.fn());
    const row = screen.getByRole('button');
    expect(row.getAttribute('tabindex')).toBe('0');
  });

  it('fires onClick on mouse click', () => {
    const onClick = vi.fn();
    renderRow(onClick);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('fires onClick on Enter', () => {
    const onClick = vi.fn();
    renderRow(onClick);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('fires onClick on Space', () => {
    const onClick = vi.fn();
    renderRow(onClick);
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire onClick on unrelated keys', () => {
    const onClick = vi.fn();
    renderRow(onClick);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Tab' });
    expect(onClick).not.toHaveBeenCalled();
  });

  it('always renders a trailing chevron cell', () => {
    renderRow(vi.fn());
    expect(screen.getByText('›')).toBeTruthy();
  });
});
