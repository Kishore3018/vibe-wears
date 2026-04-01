import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '@core/services/cart.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const token = localStorage.getItem('access_token');
  const router = inject(Router);
  const cartService = inject(CartService);
  
  let request = req;
  
  if (token) {
    request = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expired or invalid - clear storage and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        cartService.resetCartState();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
