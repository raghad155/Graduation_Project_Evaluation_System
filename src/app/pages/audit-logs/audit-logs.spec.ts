import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditLogs } from './audit-logs';

describe('AuditLogs', () => {
  let component: AuditLogs;
  let fixture: ComponentFixture<AuditLogs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditLogs, IconComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuditLogs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

