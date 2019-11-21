import { Directive, HostBinding, Host, HostListener } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { SourceMapGenerator } from '@angular/compiler/src/output/source_map';



@Directive({
  // tslint:disable-next-line
  selector: 'input[type=file]',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: FileValueAccessorDirective, multi: true },
  ],
})
export class FileValueAccessorDirective implements ControlValueAccessor {
  writeValue(obj: any): void {
  }
  registerOnChange(fn: any): void {
    this.onChange = () => {
      console.log('test');
      fn();
    };
  }
  registerOnTouched(fn: any): void {
    this.onTouched = () => {
      console.log('test2');
      fn();
    };
  }
  setDisabledState?(isDisabled: boolean): void {
  }

  @HostListener('(change)', ['$event.target.files'])
  public onChange(e: any) {
    console.log('test');
  }

  @HostListener('(blur)')
  public onTouched() {

  }
}
