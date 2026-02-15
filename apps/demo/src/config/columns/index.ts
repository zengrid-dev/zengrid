import { createBasicColumns } from './basic-columns';
import { createRendererColumns } from './renderer-columns';
import { createDataColumns } from './data-columns';

export function getColumns(data: any[][]) {
  return [
    ...createBasicColumns(),
    ...createRendererColumns(data),
    ...createDataColumns(),
  ];
}
