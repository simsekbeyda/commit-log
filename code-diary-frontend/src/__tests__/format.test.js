import { countWords, readingMinutes } from '../utils/format';

test('countWords boşlukları doğru sayar', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('  merhaba   dünya \n spring ')).toBe(3);
});

test('readingMinutes en az 1 dakika döner', () => {
    expect(readingMinutes('kısa')).toBe(1);
    expect(readingMinutes('kelime '.repeat(600))).toBe(3);
});
