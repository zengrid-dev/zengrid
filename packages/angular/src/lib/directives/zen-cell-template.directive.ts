import { Directive, TemplateRef, inject } from '@angular/core';
import type { ZenCellTemplateContext } from '../types';

@Directive({
  selector: '[zenCellTemplate]',
  standalone: true,
})
export class ZenCellTemplateDirective {
  readonly templateRef = inject(TemplateRef<ZenCellTemplateContext>);
}
