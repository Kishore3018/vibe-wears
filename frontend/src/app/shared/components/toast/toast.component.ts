import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

// Simple in-component toast service
let toastIdCounter = 0;
const toastSubject = {
  listeners: [] as ((toasts: Toast[]) => void)[],
  toasts: [] as Toast[],
  
  show(toast: Omit<Toast, 'id'>) {
    const newToast = { ...toast, id: ++toastIdCounter };
    this.toasts = [...this.toasts, newToast];
    this.notify();
    
    setTimeout(() => {
      this.dismiss(newToast.id);
    }, toast.duration || 4000);
  },
  
  dismiss(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  },
  
  subscribe(fn: (toasts: Toast[]) => void) {
    this.listeners.push(fn);
    fn(this.toasts);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  },
  
  notify() {
    this.listeners.forEach(fn => fn(this.toasts));
  }
};

// Export helper functions
export const showToast = {
  success: (title: string, message: string, duration = 4000) => 
    toastSubject.show({ type: 'success', title, message, duration }),
  error: (title: string, message: string, duration = 5000) => 
    toastSubject.show({ type: 'error', title, message, duration }),
  warning: (title: string, message: string, duration = 4000) => 
    toastSubject.show({ type: 'warning', title, message, duration }),
  info: (title: string, message: string, duration = 4000) => 
    toastSubject.show({ type: 'info', title, message, duration }),
};

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('toastAnimation', [
      state('void', style({ transform: 'translateX(100%)', opacity: 0 })),
      state('*', style({ transform: 'translateX(0)', opacity: 1 })),
      transition('void => *', animate('300ms ease-out')),
      transition('* => void', animate('200ms ease-in'))
    ])
  ],
  template: `
    <div class="toast-container">
      @for (toast of toasts; track toast.id) {
        <div 
          class="toast" 
          [class]="'toast-' + toast.type"
          [@toastAnimation]
        >
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') {
                <span class="material-icons">check_circle</span>
              }
              @case ('error') {
                <span class="material-icons">error</span>
              }
              @case ('warning') {
                <span class="material-icons">warning</span>
              }
              @case ('info') {
                <span class="material-icons">info</span>
              }
            }
          </div>
          <div class="toast-content">
            <h4 class="toast-title">{{ toast.title }}</h4>
            <p class="toast-message">{{ toast.message }}</p>
          </div>
          <button class="toast-close" (click)="dismiss(toast.id)">
            <span class="material-icons">close</span>
          </button>
          <div class="toast-progress" [style.animation-duration.ms]="toast.duration || 4000"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 100px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
      width: calc(100% - 40px);
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border-radius: 12px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(10px);
    }

    .toast-icon {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .material-icons {
        font-size: 24px;
      }
    }

    .toast-success .toast-icon {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
    }

    .toast-error .toast-icon {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
    }

    .toast-warning .toast-icon {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
    }

    .toast-info .toast-icon {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }

    .toast-content {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #ffffff;
      margin: 0 0 4px 0;
    }

    .toast-message {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.7);
      margin: 0;
      line-height: 1.4;
    }

    .toast-close {
      flex-shrink: 0;
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.5);
      transition: color 0.2s;
      
      &:hover {
        color: white;
      }

      .material-icons {
        font-size: 18px;
      }
    }

    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      width: 100%;
      animation: progress linear forwards;
    }

    .toast-success .toast-progress {
      background: linear-gradient(90deg, #10b981, #34d399);
    }

    .toast-error .toast-progress {
      background: linear-gradient(90deg, #ef4444, #f87171);
    }

    .toast-warning .toast-progress {
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
    }

    .toast-info .toast-progress {
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
    }

    @keyframes progress {
      from { width: 100%; }
      to { width: 0%; }
    }

    @media (max-width: 480px) {
      .toast-container {
        top: 80px;
        right: 10px;
        left: 10px;
        width: auto;
        max-width: none;
      }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private unsubscribe?: () => void;

  ngOnInit() {
    this.unsubscribe = toastSubject.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  ngOnDestroy() {
    this.unsubscribe?.();
  }

  dismiss(id: number) {
    toastSubject.dismiss(id);
  }
}
