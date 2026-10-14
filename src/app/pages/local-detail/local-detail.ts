import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LocalService } from '../../services/local.service';
import { Local, CapacidadLocal } from '../../models/local.model';
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
  capacidad = signal<CapacidadLocal | null>(null);
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

  porcentajeOcupacion = computed(() => {
    const cap = this.capacidad();
    if (!cap || cap.capacidadLocalM3 == null || cap.capacidadLocalM3 <= 0) return null;
    return Math.min(100, Math.round((cap.donacionesEnAlmacen / cap.capacidadLocalM3) * 100));
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
    this.localService.capacidad(id).subscribe({
      next: (data) => this.capacidad.set(data),
      error: () => this.capacidad.set(null),
    });
  }
}
