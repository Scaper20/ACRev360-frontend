const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function threeDigits(n: number): string {
  let s = '';
  if (n >= 100) {
    s += ONES[Math.floor(n / 100)] + ' Hundred';
    n %= 100;
    if (n) s += ' and ';
  }
  if (n >= 20) {
    s += TENS[Math.floor(n / 10)];
    if (n % 10) s += '-' + ONES[n % 10].toLowerCase();
  } else if (n > 0) {
    s += ONES[n];
  }
  return s;
}

function numberToWords(n: number): string {
  n = Math.round(n);
  if (n === 0) return 'Zero';
  const groups: [number, string][] = [
    [1e9, 'Billion'],
    [1e6, 'Million'],
    [1e3, 'Thousand'],
    [1, ''],
  ];
  let s = '';
  for (const [size, label] of groups) {
    if (n >= size) {
      const count = Math.floor(n / size);
      s += (s ? ' ' : '') + threeDigits(count) + (label ? ' ' + label : '');
      n %= size;
    }
  }
  return s.trim();
}

/** "Amount in Words" for the Demand Notice — e.g. amountInWords(15750.5) →
 * "Fifteen Thousand, Seven Hundred and Fifty Naira, Fifty Kobo Only". */
export function amountInWords(amount: number): string {
  const naira = Math.floor(amount);
  const kobo = Math.round((amount - naira) * 100);
  let words = numberToWords(naira) + ' Naira';
  if (kobo > 0) words += ', ' + numberToWords(kobo) + ' Kobo';
  return words + ' Only';
}
