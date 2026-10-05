import { buildWeeks } from '../components/ActivityHeatmap';

test('haftalar pazartesiden başlar ve aralık dışı günler boş kalır', () => {
    // 2026-10-01 bir perşembe; ilk hafta 2026-09-28 pazartesiden başlar
    const weeks = buildWeeks('2026-10-01', '2026-10-12');
    expect(weeks).toHaveLength(3);
    expect(weeks[0]).toEqual([null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
    expect(weeks[1][0]).toBe('2026-10-05');
    expect(weeks[2]).toEqual(['2026-10-12']);
});
