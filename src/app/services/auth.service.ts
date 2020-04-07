import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {BehaviorSubject, bindNodeCallback, Observable, of} from 'rxjs';
import {Router} from '@angular/router';
import * as auth0 from 'auth0-js';
import {element} from 'protractor';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  auth0 = new auth0.WebAuth({
    clientID: environment.auth0.clientID,
    domain: environment.auth0.domain,
    responseType: 'token id_token',
    redirectUri: environment.auth0.redirectUri,
    scope: 'openid profile email'
  });
  // Track whether or not to renew token
  private authFlag = 'isLoggedIn';
  private userProfileFlag = 'userProfile';

  // Store authentication data
  // Create stream for token
  token$: Observable<string>;
  // Create stream for user profile data
  userProfile$ = new BehaviorSubject<any>(null);

  // Authentication Navigation
  onAuthSuccessUrl = '/';
  onAuthFailureUrl = '/';
  logoutUrl = environment.auth0.logoutUrl;

// Create observable of Auth0 parseHash method to gather auth results
  parseHash$ = bindNodeCallback(this.auth0.parseHash.bind(this.auth0));
  // Create observable of Auth0 checkSession method to
  // verify authorization server session and renew tokens
  checkSession$ = bindNodeCallback(this.auth0.checkSession.bind(this.auth0));

  constructor(private router: Router) {
    const userProfile = localStorage.getItem(this.userProfileFlag);
    if (userProfile) {
      this.userProfile$.next(JSON.parse(userProfile));
    }
  }

  login = () => this.auth0.authorize();

  handleLoginCallback = () => {
    if (window.location.hash && !this.authenticated) {
      this.parseHash$().subscribe({
        next: authResult => {
          this.setAuth(authResult);
          window.location.hash = '';
          this.router.navigate([this.onAuthSuccessUrl]);
        },
        error: err => this.handleError(err)
      });
    }
  }

  private setAuth = authResult => {

    this.token$ = of(authResult.accessToken);

    const userProfile = authResult.idTockenPayload;

    this.userProfile$.next(userProfile);

    localStorage.setItem(this.userProfileFlag, JSON.stringify(userProfile));

    localStorage.setItem(this.authFlag, JSON.stringify(true));
  }

  get authenticated(): boolean {
    return JSON.parse(localStorage.getItem(this.authFlag));
  }

  renewAuth() {
    if (this.authenticated) {
      this.checkSession$({}).subscribe({
        next: authResult => this.setAuth(authResult),
        error: err => {
          localStorage.removeItem(this.authFlag);
          localStorage.removeItem(this.userProfileFlag);
          this.router.navigate([this.onAuthFailureUrl]);
        }
      });
    }
  }

  logout = () => {
    localStorage.setItem(this.authFlag, JSON.stringify(false));

    localStorage.removeItem(this.userProfileFlag);

    this.auth0.logout({
      returnTo: this.logoutUrl,
      clientID: environment.auth0.clientID
    });
  }

  private handleError = err => {
    if (err.error_description) {
      console.error('Error: ${err.error.description]');
    } else {
      console.error(`Error: ${JSON.stringify(err)}`);
    }
  }
}
