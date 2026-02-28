import { Directive, TemplateRef, inject } from '@angular/core';
import type { ZenHeaderTemplateContext } from '../types';

@Directive({
  selector: '[zenHeaderTemplate]',
  standalone: true,
})
export class ZenHeaderTemplateDirective {
  readonly templateRef = inject(TemplateRef<ZenHeaderTemplateContext>);
}
