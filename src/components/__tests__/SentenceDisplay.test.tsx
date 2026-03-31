import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SentenceDisplay } from '../SentenceDisplay';

describe('SentenceDisplay', () => {
  it('renders N/A when sentence is empty', () => {
    render(<SentenceDisplay sentence="" />);
    expect(screen.getByText('N/A')).toBeDefined();
  });

  it('renders raw text when sentence cannot be parsed', () => {
    render(<SentenceDisplay sentence="some unparseable text" />);
    expect(screen.getByText('some unparseable text')).toBeDefined();
  });

  it('renders structured sentence parts', () => {
    const sentence = 'Jail Sentenced: 364: DD';
    render(<SentenceDisplay sentence={sentence} />);
    expect(screen.getByText('364 days')).toBeDefined();
  });

  it('formats financial values with dollar sign', () => {
    const sentence = 'Sentence Fine Total: 500: $$';
    render(<SentenceDisplay sentence={sentence} />);
    expect(screen.getByText('$500.00')).toBeDefined();
  });

  it('renders multiple sentence parts separated by semicolons', () => {
    const sentence = 'Jail Sentenced: 30: DD; Sentence Fine Total: 200: $$';
    render(<SentenceDisplay sentence={sentence} />);
    expect(screen.getByText('30 days')).toBeDefined();
    expect(screen.getByText('$200.00')).toBeDefined();
  });

  it('deduplicates identical parts and shows count', () => {
    const sentence = 'Jail Sentenced: 30: DD; Jail Sentenced: 30: DD';
    render(<SentenceDisplay sentence={sentence} />);
    expect(screen.getByText(/×2/)).toBeDefined();
  });

  it('truncates in compact mode when more than 4 parts', () => {
    const parts = Array.from({ length: 6 }, (_, i) => `Type${i}: ${i + 1}: DD`).join('; ');
    render(<SentenceDisplay sentence={parts} compact />);
    expect(screen.getByText(/\+\d+ more/)).toBeDefined();
  });
});
