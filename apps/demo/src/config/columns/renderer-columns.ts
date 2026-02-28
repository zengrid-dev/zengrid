import {
  CheckboxRenderer,
  ProgressBarRenderer,
  LinkRenderer,
  ButtonRenderer,
  DateRenderer,
  DateRangeRenderer,
  SelectRenderer,
  ChipRenderer,
  DropdownRenderer,
  // New datetime editors (with fixed popup/scroll behavior)
  DateEditor,
  DateRangeEditor,
} from '../../../../../packages/core/src/index';

export function createRendererColumns(data: any[][]) {
  return [
    {
      field: 'active',
      header: {
        text: 'Active',
        type: 'sortable',
        leadingIcon: { content: '✓', position: 'leading' },
        tooltip: { content: 'Active Status - CheckboxRenderer' },
        sortIndicator: { show: true, position: 'trailing' },
        interactive: true,
      },
      width: 100,
      renderer: new CheckboxRenderer({
        onChange: (value, params) => {
        }
      }),
      sortable: true,
      minWidth: 80,
    },
    {
      field: 'progress',
      header: {
        text: 'Progress',
        type: 'sortable',
        leadingIcon: { content: '📊', position: 'leading' },
        tooltip: { content: 'Progress (%) - ProgressBarRenderer' },
        sortIndicator: { show: true, position: 'trailing' },
        interactive: true,
      },
      width: 140,
      renderer: new ProgressBarRenderer({
        min: 0,
        max: 100,
        showValue: true,
        colors: [
          { threshold: 30, color: '#f44336' },
          { threshold: 70, color: '#ff9800' },
          { threshold: 100, color: '#4caf50' }
        ]
      }),
      sortable: true,
      minWidth: 100,
    },
    {
      field: 'website',
      header: {
        text: 'Website',
        type: 'text',
        leadingIcon: { content: '🔗', position: 'leading' },
        tooltip: { content: 'Website Link - LinkRenderer' },
      },
      width: 200,
      renderer: new LinkRenderer({
        label: (params) => `Visit ${params.cell.row}`,
        target: '_blank'
      }),
      sortable: true,
      minWidth: 150,
    },
    {
      field: 'actions',
      header: {
        text: 'Actions',
        type: 'text',
        leadingIcon: { content: '⚡', position: 'leading' },
        tooltip: { content: 'Actions - ButtonRenderer' },
      },
      width: 120,
      renderer: new ButtonRenderer({
        label: 'Delete',
        variant: 'danger',
        size: 'small',
        onClick: (params) => {
          alert(`Delete action for:\nID: ${data[params.cell.row][0]}\nName: ${data[params.cell.row][1]}`);
        }
      }),
      sortable: false,
      minWidth: 100,
    },
    {
      field: 'createdAt',
      header: {
        text: 'Created',
        type: 'sortable',
        leadingIcon: { content: '📅', position: 'leading' },
        tooltip: { content: 'Created Date - Click to edit with DateEditor' },
        sortIndicator: { show: true, position: 'trailing' },
        interactive: true,
      },
      width: 120,
      renderer: new DateRenderer({
        format: 'MM/DD/YYYY',
        locale: 'en-US',
        onClick: (date, params) => {
        }
      }),
      sortable: true,
      minWidth: 100,
      editable: true,
      editor: new DateEditor({
        format: 'DD/MM/YYYY',
        minDate: new Date('2020-01-01'),
        maxDate: new Date('2030-12-31'),
        required: true,
        placeholder: 'Select a date...',
        autoFocus: true,
        theme: 'light',
        useCalendarPopup: true,
      }),
    },
    {
      field: 'dateRange',
      header: {
        text: 'Project Duration',
        type: 'sortable',
        leadingIcon: { content: '📆', position: 'leading' },
        tooltip: { content: 'Project Duration - Double-click to edit date range' },
        sortIndicator: { show: true, position: 'trailing' },
        interactive: true,
      },
      width: 300,
      renderer: new DateRangeRenderer({
        format: 'DD/MM/YYYY',
        showDuration: true,
        showCalendar: false,
        separator: ' → ',
        chipStyle: false,
        startColor: '#1976d2',
        endColor: '#7b1fa2',
        onClick: (range, params) => {
        }
      }),
      sortable: true,
      minWidth: 250,
      maxWidth: 500,
      editable: true,
      editor: new DateRangeEditor({
        format: 'DD/MM/YYYY',
        minDate: new Date('2024-01-01'),
        maxDate: new Date('2025-12-31'),
        required: true,
        placeholder: 'Select project duration...',
        autoFocus: true,
        theme: 'light',
        allowSameDate: true,
      }),
    },
    {
      field: 'priority',
      header: {
        text: 'Priority',
        type: 'filterable',
        leadingIcon: { content: '🎯', position: 'leading' },
        tooltip: { content: 'Priority Level - SelectRenderer' },
        sortIndicator: { show: true, position: 'trailing' },
        interactive: true,
      },
      width: 140,
      renderer: new SelectRenderer({
        options: [
          { label: 'Low', value: 'Low' },
          { label: 'Medium', value: 'Medium' },
          { label: 'High', value: 'High' },
          { label: 'Critical', value: 'Critical' }
        ],
        onChange: (value, params) => {
        }
      }),
      sortable: true,
      minWidth: 100,
    },
    {
      field: 'tags',
      header: {
        text: 'Tags (Fixed + Scroll)',
        type: 'text',
        leadingIcon: { content: '📜', position: 'leading' },
        tooltip: { content: 'Tags with SCROLL mode - Row stays 32px, scroll horizontally to see all' },
      },
      width: 250,
      renderer: new ChipRenderer({
        overflowMode: 'scroll',
        removable: true,
        showOverflowTooltip: true,
        onRemove: (chip, params) => {
        },
        onClick: (chip, params) => {
        }
      }),
      sortable: false,
      minWidth: 180,
      autoHeight: false,
      overflow: { mode: 'scroll' },
    },
    {
      field: 'tags2',
      header: {
        text: 'Tags (Fixed + Scroll)',
        type: 'text',
        leadingIcon: { content: '📜', position: 'leading' },
        tooltip: { content: 'Tags with SCROLL mode - Row stays 32px, scroll horizontally to see all' },
      },
      width: 250,
      renderer: new ChipRenderer({
        overflowMode: 'scroll',
        removable: true,
        showOverflowTooltip: true,
        onRemove: (chip, params) => {
        },
        onClick: (chip, params) => {
        }
      }),
      sortable: false,
      minWidth: 180,
      autoHeight: false,
      overflow: { mode: 'scroll' },
    },
    {
      field: 'category',
      header: {
        text: 'Category',
        type: 'filterable',
        leadingIcon: { content: '📂', position: 'leading' },
        tooltip: { content: 'Category - DropdownRenderer' },
        sortIndicator: { show: true, position: 'trailing' },
        interactive: true,
      },
      width: 160,
      renderer: new DropdownRenderer({
        options: [
          { label: 'Category A', value: 'Category A' },
          { label: 'Category B', value: 'Category B' },
          { label: 'Category C', value: 'Category C' },
          { label: 'Category D', value: 'Category D' }
        ],
        searchable: true,
        onChange: (value, params) => {
        }
      }),
      sortable: true,
      minWidth: 120,
    },
  ];
}
