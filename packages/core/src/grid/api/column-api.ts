import type { ColumnConstraints } from '../../features/column-resize';
import type { ColumnStateSnapshot } from '../../types';
import type { SlimGridContext } from '../grid-context';

export interface ColumnApi {
  attachResize(headerElement: HTMLElement): void;
  detachResize(): void;
  resize(col: number, width: number): void;
  autoFit(col: number): void;
  autoFitAll(): void;
  setConstraints(col: number, constraints: ColumnConstraints): void;
  updateResizeHandles(): void;
  attachDrag(headerElement: HTMLElement): void;
  detachDrag(): void;
  isDragging(): boolean;
  getState(): ColumnStateSnapshot[];
  applyState(state: ColumnStateSnapshot[], options?: { applyWidth?: boolean; applyVisibility?: boolean; applyOrder?: boolean }): void;
}

export function createColumnApi(ctx: SlimGridContext): ColumnApi {
  return {
    attachResize(headerElement: HTMLElement): void {
      ctx.store.exec('column:attachResize', headerElement);
    },

    detachResize(): void {
      ctx.store.exec('column:detachResize');
    },

    resize(col: number, width: number): void {
      ctx.store.exec('column:resizeColumn', col, width);
    },

    autoFit(col: number): void {
      ctx.store.exec('column:autoFit', col);
    },

    autoFitAll(): void {
      ctx.store.exec('column:autoFitAll');
    },

    setConstraints(col: number, constraints: ColumnConstraints): void {
      ctx.store.exec('column:setConstraints', col, constraints);
    },

    updateResizeHandles(): void {
      ctx.store.exec('column:updateResizeHandles');
    },

    attachDrag(headerElement: HTMLElement): void {
      ctx.store.exec('column:attachDrag', headerElement);
    },

    detachDrag(): void {
      ctx.store.exec('column:detachDrag');
    },

    isDragging(): boolean {
      const api = ctx.gridApi.getMethod('column', 'isDragging');
      return api ? api() : false;
    },

    getState(): ColumnStateSnapshot[] {
      const api = ctx.gridApi.getMethod('column', 'getState');
      return api ? api() : [];
    },

    applyState(state: ColumnStateSnapshot[], options?: { applyWidth?: boolean; applyVisibility?: boolean; applyOrder?: boolean }): void {
      ctx.store.exec('column:applyState', state, options);
    },
  };
}
