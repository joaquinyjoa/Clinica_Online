import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appResaltar]',
  standalone: true
})
export class ResaltarDirective {
  @Input() appResaltar: string = '#ffeb3b';

  constructor(private el: ElementRef) {}

  @HostListener('mouseenter') onMouseEnter() {
    this.resaltar(this.appResaltar || '#ffeb3b');
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.resaltar('');
  }

  private resaltar(color: string) {
    this.el.nativeElement.style.backgroundColor = color;
  }
}