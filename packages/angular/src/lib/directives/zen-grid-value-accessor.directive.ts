import { Directive, forwardRef, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { ZenGridComponent } from '../components/zen-grid.component';

@Directive({
  selector: 'zen-grid[formControl],zen-grid[formControlName],zen-grid[ngModel]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZenGridValueAccessorDirective),
      multi: true,
    },
  ],
})
export class ZenGridValueAccessorDirective implements ControlValueAccessor {
  private readonly grid = inject(ZenGridComponent);
  private onChange: (value: any[][]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    this.grid.dataChange.subscribe(() => {
      this.onChange(this.grid.data());
      this.onTouched();
    });
  }

  writeValue(value: any[][]): void {
    if (value) {
      this.grid.setData(value);
    }
  }

  registerOnChange(fn: (value: any[][]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
