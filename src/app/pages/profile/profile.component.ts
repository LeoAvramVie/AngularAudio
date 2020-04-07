import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  userProfile;
  constructor(authService: AuthService) {
    authService.userProfile$.subscribe(profile => {
      this.userProfile = profile;
    });
  }

  ngOnInit() {
  }

}
