import { Directive, TemplateRef, inject } from '@angular/core';
import type { ZenEditorTemplateContext } from '../types';

@Directive({
  selector: '[zenEditorTemplate]',
  standalone: true,
})
export class ZenEditorTemplateDirective {
  readonly templateRef = inject(TemplateRef<ZenEditorTemplateContext>);
}
