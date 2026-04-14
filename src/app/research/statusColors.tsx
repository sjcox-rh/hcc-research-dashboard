import * as React from 'react';
import { Label } from '@patternfly/react-core';

export type LabelColor = NonNullable<React.ComponentProps<typeof Label>['color']>;

const STATUS_LABEL_COLORS: LabelColor[] = [
  'blue',
  'teal',
  'green',
  'orange',
  'purple',
  'red',
  'orangered',
  'yellow',
  'grey',
];

export function buildStatusColorMap(statusNames: string[]): Map<string, LabelColor> {
  const unique = Array.from(new Set(statusNames.map(s => s.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );
  const map = new Map<string, LabelColor>();
  unique.forEach((name, i) => {
    map.set(name, STATUS_LABEL_COLORS[i % STATUS_LABEL_COLORS.length]);
  });
  return map;
}

export const IssueStatusLabel: React.FunctionComponent<{
  status: string;
  colorMap: Map<string, LabelColor>;
}> = ({ status, colorMap }) => {
  const key = status.trim();
  const color = colorMap.get(key) ?? 'grey';
  return (
    <Label color={color} isCompact variant="filled">
      {status}
    </Label>
  );
};
