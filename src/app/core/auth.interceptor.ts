import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = localStorage.getItem('gpe-ui-token');
  const router = inject(Router);

  let headers = request.headers;

  if (request.url.startsWith('/api')) {
    headers = headers.set('Accept', 'application/json');
    if (token && request.url !== '/api/login') {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return next(request.clone({ headers })).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        localStorage.removeItem('gpe-ui-user');
        localStorage.removeItem('gpe-ui-token');
        router.navigateByUrl('/login');
      }
      return throwError(() => error);
    })
  );
};
