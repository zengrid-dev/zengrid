import { ColumnModel } from '../../../src/features/columns/column-model';
import { ColumnReorderPlugin } from '../../../src/features/columns/plugins/column-reorder';

describe('ColumnReorderPlugin', () => {
  it('should reorder columns correctly', () => {
    const columns = [
      { field: 'A', header: 'A' },
      { field: 'B', header: 'B' },
      { field: 'C', header: 'C' },
    ];
    
    const model = new ColumnModel(columns);
    const reorder = new ColumnReorderPlugin(model);
    
    expect(model.getColumns().sort((a, b) => a.order - b.order).map(c => c.field)).toEqual(['A', 'B', 'C']);
    
    reorder.move('col-0', 2);
    
    expect(model.getColumns().sort((a, b) => a.order - b.order).map(c => c.field)).toEqual(['B', 'C', 'A']);
  });
});
