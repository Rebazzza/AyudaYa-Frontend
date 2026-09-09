import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.html',
})
export class NavbarComponent {
  session = inject(SessionService);

  logout() {
    this.session.clearUser();
    window.location.href = '/';
  }
}
