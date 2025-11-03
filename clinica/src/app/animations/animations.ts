import { trigger, state, style, transition, animate, query, group } from '@angular/animations';

// Animación de slide-in desde la derecha
export const slideInAnimation = trigger('slideIn', [
  transition(':enter', [
    style({ transform: 'translateX(100%)', opacity: 0 }),
    animate('500ms ease-in-out', style({ transform: 'translateX(0%)', opacity: 1 }))
  ]),
  transition(':leave', [
    animate('300ms ease-in-out', style({ transform: 'translateX(-100%)', opacity: 0 }))
  ])
]);

// Animación de fade in/out
export const fadeInAnimation = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.95)' }),
    animate('400ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
  ]),
  transition(':leave', [
    animate('300ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
  ])
]);

// Animación para rutas (transiciones entre páginas)
export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    // Estado inicial: nueva página entra desde la derecha
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      })
    ], { optional: true }),
    
    // Configurar estado inicial de la página que entra
    query(':enter', [
      style({ transform: 'translateX(100%)', opacity: 0 })
    ], { optional: true }),
    
    // Animar ambas páginas
    group([
      // Página que sale: se mueve hacia la izquierda y se desvanece
      query(':leave', [
        animate('400ms ease-in-out', 
          style({ 
            transform: 'translateX(-100%)', 
            opacity: 0 
          })
        )
      ], { optional: true }),
      
      // Página que entra: viene desde la derecha
      query(':enter', [
        animate('400ms ease-in-out', 
          style({ 
            transform: 'translateX(0%)', 
            opacity: 1 
          })
        )
      ], { optional: true })
    ])
  ])
]);

// Animación de carga suave para listas
export const listAnimation = trigger('listAnimation', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
    ], { optional: true })
  ])
]);

// Animación de botones con hover mejorado
export const buttonAnimation = trigger('buttonHover', [
  state('normal', style({ transform: 'scale(1)' })),
  state('hovered', style({ transform: 'scale(1.05)' })),
  transition('normal <=> hovered', animate('200ms ease-in-out'))
]);

// Animación de slide up para modales/toasts
export const slideUpAnimation = trigger('slideUp', [
  transition(':enter', [
    style({ transform: 'translateY(100%)', opacity: 0 }),
    animate('350ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
      style({ transform: 'translateY(0%)', opacity: 1 })
    )
  ]),
  transition(':leave', [
    animate('250ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
      style({ transform: 'translateY(100%)', opacity: 0 })
    )
  ])
]);

// Animación de zoom para elementos importantes
export const zoomInAnimation = trigger('zoomIn', [
  transition(':enter', [
    style({ transform: 'scale(0)', opacity: 0 }),
    animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', 
      style({ transform: 'scale(1)', opacity: 1 })
    )
  ])
]);

// Animación de stagger para elementos de lista que aparecen secuencialmente
export const staggerAnimation = trigger('stagger', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(30px)' }),
      animate('0ms') // Sin delay para el primer elemento
    ], { optional: true }),
    query(':enter', [
      animate('400ms {{delay}}ms ease-out', 
        style({ opacity: 1, transform: 'translateY(0px)' })
      )
    ], { optional: true })
  ])
]);