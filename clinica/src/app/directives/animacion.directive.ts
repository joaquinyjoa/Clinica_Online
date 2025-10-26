import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appAnimacion]',
  standalone: true
})
export class AnimacionDirective implements OnInit {
  @Input() appAnimacion: 'fadeIn' | 'slideIn' | 'bounce' = 'fadeIn';

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.aplicarAnimacion();
  }

  private aplicarAnimacion() {
    const element = this.el.nativeElement;
    
    switch (this.appAnimacion) {
      case 'fadeIn':
        element.style.animation = 'fadeIn 0.5s ease-in';
        break;
      case 'slideIn':
        element.style.animation = 'slideInFromLeft 0.5s ease-out';
        break;
      case 'bounce':
        element.style.animation = 'bounce 0.6s ease-in-out';
        break;
    }

    // Agregar las animaciones CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideInFromLeft {
        from { transform: translateX(-100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
      }
    `;
    
    if (!document.head.querySelector('style[data-animations]')) {
      style.setAttribute('data-animations', 'true');
      document.head.appendChild(style);
    }
  }
}