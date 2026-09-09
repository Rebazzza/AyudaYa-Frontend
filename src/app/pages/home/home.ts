import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocalService } from '../../services/local.service';
import { Local } from '../../models/local.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
})
export class HomeComponent implements OnInit {
  private localService = inject(LocalService);

  locales = signal<Local[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.localService.listar().subscribe({
      next: (data) => {
        this.locales.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
