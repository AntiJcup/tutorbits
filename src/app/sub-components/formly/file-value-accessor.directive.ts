import { Directive, HostBinding, Host, HostListener } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { SourceMapGenerator } from '@angular/compiler/src/output/source_map';



@Directive({
  // tslint:disable-next-line
  selector: 'input[type=file]',
  host: {
    '(change)': 'onChange($event.target.files)',
    '(blur)': 'onTouched()',
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: FileValueAccessorDirective, multi: true },
  ],
})
export class FileValueAccessorDirective implements ControlValueAccessor {
  writeValue(obj: any): void {
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
  }

  public onChange(e: any) {
  }

  public onTouched() {

  }
}
