import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toasts; track toast.id) {
        <div 
          class="toast-item"
          [class.toast-success]="toast.type === 'success'"
          [class.toast-error]="toast.type === 'error'"
          [class.toast-warning]="toast.type === 'warning'"
          [class.toast-info]="toast.type === 'info'">
          
          <div class="toast-content">
            <span class="toast-icon">{{ toast.icon }}</span>
            <span class="toast-message">{{ toast.message }}</span>
            <button 
              class="toast-close" 
              (click)="closeToast(toast.id)"
              aria-label="Cerrar mensaje">
              ✕
            </button>
          </div>
          
          @if (toast.duration !== 0) {
            <div class="toast-progress" 
                 [style.animation-duration]="toast.duration + 'ms'">
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrls: ['./toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: ToastMessage[] = [];
  private subscription: Subscription = new Subscription();

  constructor(
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscription = this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
      this.cdr.detectChanges(); // Forzar detección inmediata
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  closeToast(id: string): void {
    this.toastService.removeToast(id);
  }
}