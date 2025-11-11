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
export const fadeInAnimation = trigger('fadeInAnimation', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.95)' }),
    animate('400ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
  ]),
  transition(':leave', [
    animate('300ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
  ])
]);

// Alias para compatibilidad
export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.95)' }),
    animate('400ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
  ]),
  transition(':leave', [
    animate('300ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
  ])
]);

// Animación de slide desde abajo (para modales o secciones especiales)
export const slideFromBottomAnimation = trigger('slideFromBottomAnimation', [
  transition(':enter', [
    style({ transform: 'translateY(100%)', opacity: 0 }),
    animate('500ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
      style({ transform: 'translateY(0%)', opacity: 1 })
    )
  ]),
  transition(':leave', [
    animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
      style({ transform: 'translateY(100%)', opacity: 0 })
    )
  ])
]);

// Animación de entrada con rebote (para elementos destacados)
export const bounceInAnimation = trigger('bounceIn', [
  transition(':enter', [
    style({ transform: 'scale(0.3)', opacity: 0 }),
    animate('600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', 
      style({ transform: 'scale(1)', opacity: 1 })
    )
  ])
]);

// Animación para rutas (transiciones entre páginas) - Versión simplificada
export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    // Simplemente hacer fade in/out sin posicionamiento absoluto
    query(':enter', [
      style({ opacity: 0 }),
      animate('300ms ease-in', style({ opacity: 1 }))
    ], { optional: true }),
    
    query(':leave', [
      animate('300ms ease-out', style({ opacity: 0 }))
    ], { optional: true })
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
export const slideUpAnimation = trigger('slideUpAnimation', [
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

// Animación de slide desde abajo para modales y elementos emergentes
export const slideUpFromBottom = trigger('slideUpFromBottom', [
  transition(':enter', [
    style({ transform: 'translateY(100%)', opacity: 0 }),
    animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
      style({ transform: 'translateY(0%)', opacity: 1 })
    )
  ]),
  transition(':leave', [
    animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
      style({ transform: 'translateY(100%)', opacity: 0 })
    )
  ])
]);

// Animación de bounce para elementos interactivos
export const bounceEnterAnimation = trigger('bounceEnter', [
  transition(':enter', [
    style({ transform: 'scale(0.3)', opacity: 0 }),
    animate('400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', 
      style({ transform: 'scale(1)', opacity: 1 })
    )
  ])
]);

// Animación de slide horizontal para navegación
export const slideHorizontal = trigger('slideHorizontal', [
  transition('left => right', [
    style({ transform: 'translateX(-100%)' }),
    animate('300ms ease-in-out', style({ transform: 'translateX(0%)' }))
  ]),
  transition('right => left', [
    style({ transform: 'translateX(100%)' }),
    animate('300ms ease-in-out', style({ transform: 'translateX(0%)' }))
  ])
]);