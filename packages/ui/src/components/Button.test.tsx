import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('defaults to the ghost variant', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button').className).toContain('btn-ghost');
  });

  it('applies the requested variant and small classes', () => {
    render(
      <Button variant="primary" small>
        Save
      </Button>,
    );
    const el = screen.getByRole('button');
    expect(el.className).toContain('btn-primary');
    expect(el.className).toContain('btn-sm');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Go
      </Button>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
