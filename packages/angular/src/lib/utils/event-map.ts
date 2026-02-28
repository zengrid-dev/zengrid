export const EVENT_MAP: Record<string, string> = {
  // Cell events
  'cell:click': 'cellClick',
  'cell:doubleClick': 'cellDoubleClick',
  'cell:contextMenu': 'cellContextMenu',
  'cell:change': 'cellChange',
  'cell:beforeChange': 'cellBeforeChange',
  'cell:afterChange': 'cellAfterChange',

  // Selection events
  'selection:change': 'selectionChange',
  'selection:start': 'selectionStart',
  'selection:end': 'selectionEnd',

  // Editing events
  'edit:start': 'editStart',
  'edit:end': 'editEnd',
  'edit:commit': 'editCommit',
  'edit:cancel': 'editCancel',

  // Scroll events
  'scroll': 'scroll',
  'scroll:start': 'scrollStart',
  'scroll:end': 'scrollEnd',

  // Sort events
  'sort:change': 'sortChange',
  'sort:beforeSort': 'sortBeforeSort',
  'sort:afterSort': 'sortAfterSort',

  // Filter events
  'filter:change': 'filterChange',
  'filter:beforeFilter': 'filterBeforeFilter',
  'filter:afterFilter': 'filterAfterFilter',
  'filter:export': 'filterExport',
  'filter:start': 'filterStart',
  'filter:end': 'filterEnd',
  'filter:error': 'filterError',
  'filter:clear': 'filterClear',

  // Focus events
  'focus:change': 'focusChange',
  'focus:in': 'focusIn',
  'focus:out': 'focusOut',

  // Keyboard events
  'key:down': 'keyDown',
  'key:up': 'keyUp',
  'key:press': 'keyPress',

  // Column events
  'column:resize': 'columnResize',
  'column:move': 'columnMove',
  'column:hide': 'columnHide',
  'column:show': 'columnShow',
  'column:dragStart': 'columnDragStart',
  'column:drag': 'columnDrag',
  'column:dragEnd': 'columnDragEnd',
  'column:dragCancel': 'columnDragCancel',

  // Header events
  'header:click': 'headerClick',
  'header:doubleClick': 'headerDoubleClick',
  'header:contextMenu': 'headerContextMenu',
  'header:hover': 'headerHover',
  'header:sort:click': 'headerSortClick',
  'header:filter:click': 'headerFilterClick',
  'header:checkbox:change': 'headerCheckboxChange',

  // Lifecycle events
  'render:start': 'renderStart',
  'render:end': 'renderEnd',
  'data:load': 'dataLoad',
  'data:change': 'dataChange',
  'loading:start': 'loadingStart',
  'loading:end': 'loadingEnd',
  'loading:progress': 'loadingProgress',

  // Undo/Redo events
  'undo-redo:change': 'undoRedoChange',

  // Destroy
  'destroy': 'gridDestroy',

  // Error events
  'error': 'gridError',
  'warning': 'gridWarning',

  // Row events
  'row:insert': 'rowInsert',
  'row:delete': 'rowDelete',
  'row:move': 'rowMove',

  // Clipboard events
  'copy': 'copy',
  'cut': 'cut',
  'paste': 'paste',
};
