import assert from 'node:assert/strict';
import { test } from 'node:test';
import { radarSegmentColors, radarWedges, hexagonPages, type RadarValue } from './radar-model';

test('every segment count receives unique, deterministic colors without cycling', () => {
  for (const count of [0, 1, 2, 3, 4, 5, 6, 7, 12, 50, 1000]) {
    const colors = radarSegmentColors(count);
    assert.equal(colors.length, count);
    assert.equal(new Set(colors).size, count);
    assert.deepEqual(colors, radarSegmentColors(count));
  }
});

test('wedge counts follow real axes, not three datasets or six padded slots', () => {
  for (const count of [2, 3, 4, 5, 6, 8, 13]) {
    const axes: RadarValue[] = Array.from({ length: count }, (_, i) => ({
      skill: `Skill ${i}`, have: 3, need: 4,
    }));
    for (const page of hexagonPages(axes)) {
      const real = page.filter(axis => !axis.placeholder);
      const wedges = radarWedges(page);
      assert.equal(wedges.length, real.length);
      assert.equal(new Set(wedges.map(wedge => wedge.color)).size, real.length);
      assert.equal(wedges.at(-1)?.next, wedges[0]?.index);
    }
  }
});

test('unassessed axes retain their wedge and do not become fabricated zero values', () => {
  const axes: RadarValue[] = [{ skill: 'A', have: null }, { skill: 'B', have: 4 }];
  const before = structuredClone(axes);
  assert.equal(radarWedges(hexagonPages(axes)[0]).length, 2);
  assert.deepEqual(axes, before);
});
