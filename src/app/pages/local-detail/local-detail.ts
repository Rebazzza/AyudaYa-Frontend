import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LocalService } from '../../services/local.service';
import { Local } from '../../models/local.model';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';

@Component({
  selector: 'app-local-detail',
  standalone: true,
  imports: [RouterLink, SafeUrlPipe],
  templateUrl: './local-detail.html',
})
export class LocalDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private localService = inject(LocalService);

  local = signal<Local | null>(null);
  loading = signal(true);
  error = signal('');

  mapUrl = computed(() => {
    const loc = this.local();
    return loc
      ? `https://maps.google.com/maps?q=${loc.latitud},${loc.longitud}&z=16&output=embed`
      : '';
  });

  mapsLink = computed(() => {
    const loc = this.local();
    return `https://www.google.com/maps/search/?api=1&query=${loc?.latitud},${loc?.longitud}`;
  });

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.localService.detalle(id).subscribe({
      next: (data) => {
        this.local.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'No se encontró el local');
      },
    });
  }
}
