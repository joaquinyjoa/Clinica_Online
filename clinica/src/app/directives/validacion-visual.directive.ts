import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appValidacionVisual]',
  standalone: true
})
export class ValidacionVisualDirective implements OnInit {
  @Input() appValidacionVisual: 'valido' | 'invalido' | 'neutro' = 'neutro';

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.aplicarEstilo();
  }

  ngOnChanges() {
    this.aplicarEstilo();
  }

  private aplicarEstilo() {
    const element = this.el.nativeElement;
    
    // Remover clases previas
    element.classList.remove('campo-valido', 'campo-invalido', 'campo-neutro');
    
    switch (this.appValidacionVisual) {
      case 'valido':
        element.classList.add('campo-valido');
        element.style.borderColor = '#28a745';
        element.style.boxShadow = '0 0 0 0.2rem rgba(40, 167, 69, 0.25)';
        break;
      case 'invalido':
        element.classList.add('campo-invalido');
        element.style.borderColor = '#dc3545';
        element.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
        break;
      default:
        element.classList.add('campo-neutro');
        element.style.borderColor = '#ced4da';
        element.style.boxShadow = 'none';
        break;
    }
  }
}