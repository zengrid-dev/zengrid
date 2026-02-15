export function createBasicColumns() {
  return [
    {
      field: 'id',
      header: {
        text: 'ID',
        type: 'sortable',
        leadingIcon: { content: '#️⃣', position: 'leading' },
        tooltip: { content: 'Employee ID - Click to sort' },
        className: 'header-id',
        sortIndicator: { show: true, ascIcon: '↑', descIcon: '↓', position: 'trailing' },
        interactive: true,
      },
      width: 80,
      renderer: 'number',
      sortable: true,
      minWidth: 50,
      maxWidth: 150,
    },
    {
      field: 'name',
      header: {
        text: 'Name',
        type: 'sortable',
        leadingIcon: { content: '👤', position: 'leading' },
        tooltip: { content: 'Employee Name - Click to sort' },
        sortIndicator: { show: true, position: 'trailing' },
        interactive: true,
      },
      width: 200,
      renderer: 'text',
      sortable: true,
      minWidth: 100,
      maxWidth: 400,
    },
    {
      field: 'department',
      header: {
        text: 'Department',
        type: 'filterable',
        leadingIcon: { content: '🏢', position: 'leading' },
        tooltip: { content: 'Department - Click to sort, use filter button to filter' },
        sortIndicator: { show: true, position: 'trailing' },
        filterIndicator: { show: true, icon: '▼', dropdownType: 'list' },
        interactive: true,
      },
      width: 150,
      renderer: 'text',
      sortable: true,
      minWidth: 100,
    },
  ];
}
