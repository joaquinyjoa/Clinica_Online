import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Especialista } from './especialista';

describe('Especialista', () => {
  let component: Especialista;
  let fixture: ComponentFixture<Especialista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Especialista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Especialista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
