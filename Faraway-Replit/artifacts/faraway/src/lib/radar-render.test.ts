import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SkillRadar } from '../components/radar';
import { CAREERS } from '../data/careers';
import { hexagonPages, jobRadarAxes, type RadarValue } from './radar-model';

const render = (axes: RadarValue[], wedges = true) => renderToStaticMarkup(
  createElement(SkillRadar, { axes, translucentFill: true, uniqueWedgeColors: wedges }),
);

function checkWedges(axes: RadarValue[]) {
  const html = render(axes);
  const count = axes.filter(axis => !axis.placeholder).length;
  const fills = [...html.matchAll(/data-radar-wedge="(\d+)" data-wedge-color="([^"]+)"/g)];
  assert.equal(fills.length, count, 'one path per wedge, not one per dataset');
  assert.equal(new Set(fills.map(match => match[2])).size, count);
  assert.equal((html.match(/data-radar-wedge-layer="true"/g) ?? []).length, 1);
  assert.equal((html.match(/<clipPath/g) ?? []).length, 1);
  assert(html.includes('stop-opacity=".28"'));
  assert(html.includes('stop-opacity=".16"'));
  const previous = render(axes, false);
  const outlines = (markup: string) => [...markup.matchAll(/<(?:polygon|polyline)[^>]*stroke="#[^"]+"[^>]*>/g)].map(match => match[0]);
  assert.deepEqual(outlines(html), outlines(previous), 'data outlines must not change');
  assert.equal((html.match(/<circle/g) ?? []).length, (previous.match(/<circle/g) ?? []).length);
}

test('different wedge counts render once each with unique colors despite three datasets', () => {
  for (const count of [3, 4, 5, 6]) {
    checkWedges(Array.from({ length: count }, (_, i) => ({
      skill: `Skill ${i}`, have: i % 5 + 1, need: 4, future: 5,
    })));
  }
});

test('all catalogue careers use the same independently colored wedge renderer', () => {
  for (const career of CAREERS) {
    const ratings = Object.fromEntries(Object.keys(career.required).map((skill, i) => [skill, i % 5 + 1]));
    for (const page of hexagonPages(jobRadarAxes(career.required, ratings, career.required))) {
      if (page.filter(axis => !axis.placeholder).length >= 3) checkWedges(page);
    }
  }
});

test('Skills Snapshot retains its existing polygon fill and no wedge layer', () => {
  const html = render(Array.from({ length: 6 }, (_, i) => ({
    skill: `Skill ${i}`, have: 3, need: 4,
  })), false);
  assert(!html.includes('data-radar-wedge'));
  assert(html.includes('stop-opacity=".28"'));
});

test('fewer than three data points do not invent filled polygon area', () => {
  for (const count of [0, 1, 2]) {
    const html = render(Array.from({ length: count }, (_, i) => ({ skill: `Skill ${i}`, have: 3 })));
    assert(!html.includes('data-radar-wedge-layer'));
  }
});
