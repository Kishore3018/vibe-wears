import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check both signal and localStorage for user data
  let user = authService.user();
  
  // If signal not yet updated, check localStorage directly
  if (!user) {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        user = JSON.parse(userData);
      } catch {
        user = null;
      }
    }
  }

  if (!user) {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (!user.is_admin) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
