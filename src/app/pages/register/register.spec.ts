import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { IaService } from '../../services/ia.service';
import { Usuario } from '../../models/usuario.model';
import { RegisterComponent } from './register';

describe('Registro con DNI', () => {
  it('conserva la cuenta sin verificar y permite reintento si falla la segunda evaluación', async () => {
    const usuario: Usuario = {
      idUsuario: 7,
      dniUsuario: '12345678',
      nombreUsuario: 'Ana',
      apellidosUsuario: 'Pérez',
      correoUsuario: 'ana@example.test',
      telefonoUsuario: '',
      nombreRol: 'Donante',
      token: 'token-prueba',
      fechaRegistro: '2026-11-15T00:00:00',
      dniVerificado: false,
    };
    const registrar = vi.fn().mockReturnValue(of(usuario));
    const evaluar = vi.fn().mockReturnValue(throwError(() => new Error('sin servicio')));
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { register: registrar } },
        { provide: IaService, useValue: { verificarDniCompleto: evaluar } },
      ],
    }).compileComponents();

    const componente = TestBed.createComponent(RegisterComponent).componentInstance;
    componente.contrasena = 'clave-segura';
    componente.contrasenaConfirm = 'clave-segura';
    componente.dniFrontal.set(new File(['frente'], 'frente.jpg', { type: 'image/jpeg' }));
    componente.dniPosterior.set(new File(['reverso'], 'reverso.jpg', { type: 'image/jpeg' }));
    componente.identidadVerificada.set(true);

    componente.onSubmit();

    expect(registrar).toHaveBeenCalledTimes(1);
    expect(evaluar).toHaveBeenCalledTimes(1);
    expect(componente.cuentaCreada()?.idUsuario).toBe(7);
    expect(componente.verificacionPendiente()).toBe(true);
    expect(componente.loading()).toBe(false);
    expect(componente.identidadError()).toContain('sin DNI verificado');

    componente.onSubmit();
    expect(registrar).toHaveBeenCalledTimes(1);
  });
});
