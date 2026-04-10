import { Component, inject, Input, ViewChild } from '@angular/core';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatIcon } from '@angular/material/icon';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { SecurityControlService } from '@admin-core/services/security-control/security-control.service';
import { MatDialog } from '@angular/material/dialog';
import { v4 as uuid } from 'uuid';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipsModule } from "@angular/material/chips";
import { CreateBpaService } from '@admin-core/services/bpa/create-bpa.service';

@Component({
  selector: 'app-security-controls-tab',
  imports: [
    MatFormField,
    MatInput,
    MatLabel,
    MatOption,
    ReactiveFormsModule,
    MatFormField,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatIcon,
    FormsModule,
    MatSelect,
    MatChipsModule
  ],
  templateUrl: './security-controls-tab.component.html',
  styleUrl: './security-controls-tab.component.scss'
})
export class SecurityControlsTabComponent {
  @Input() formGroup!: FormGroup
  @Input() securityControlList!: any[];
  @Input() editModeSecurityControls!: boolean;

  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  searchTerm = '';
  @ViewChild(MatAutocompleteTrigger) autoTrigger!: MatAutocompleteTrigger;

  filteredSecurityControlList: any[] = [];
  retentionPeriod: any = ['Days', 'Months', 'Years'];
  private securityControlService = inject(SecurityControlService);
  private configApiHelperService = inject(ConfigApiHelperService);
  constructor(private fb: FormBuilder, public dialog: MatDialog, private createBpaService: CreateBpaService) { }
  ngOnInit(): void {
    this.filteredSecurityControlList = this.securityControlList;
  }

  async addNewSecurityControl(name: string) {
    const trimmed = (name ?? '').toString().trim();
    if (!trimmed) return;

    try {
      const newControl = await this.configApiHelperService.addSecurityControls({ name: trimmed });
      if (newControl) {
        this.securityControlList = [...this.securityControlList, newControl];
        this.filteredSecurityControlList = [...this.securityControlList];
        await this.securityControlService.addSecurityControl(newControl)
        const control = this.formGroup.get('securityControl');
        const current = control?.value || [];
        const SecurityControl = current.filter((p: any) => typeof p === 'object' && p?.id);
        control?.setValue([...SecurityControl, newControl]);
      }

      this.searchTerm = '';
    } catch (e) {
      console.error('Error while adding security control', e);
    }
  }


  displaySecurityName(security: any): string {
    return security?.name || '';
  }


  onSearchControl(value: string) {
    const q = (value ?? '').toString().trim().toLowerCase();
    this.searchTerm = q;

    if (!q) {
      this.filteredSecurityControlList = [...this.securityControlList];
      return;
    }

    this.filteredSecurityControlList = this.securityControlList.filter((control: any) =>
      (control?.name ?? '').toString().toLowerCase().includes(q)
    );
  }

  add(event: any) {
    const input = event.input;
    const value = event.value?.trim();

    if (!value) return;
    const existing = this.securityControlList.find(
      (x: any) => x.name.toLowerCase() === value.toLowerCase()
    );

    if (existing) {
      return
    } else {
      const newObj = { id: uuid(), name: value };
      this.securityControlList = [...this.securityControlList, newObj];
      this.filteredSecurityControlList = [...this.securityControlList];
      this.selectControl(newObj);
      this.createBpaService.onCreateOrUpdateSecurityControl(newObj);
    }
    if (input) input.value = '';
    this.searchTerm = '';
  }


  selectControl(obj: any) {
    const control = this.formGroup.get('securityControl');
    const current = control?.value || [];
    this.filteredSecurityControlList = [...this.securityControlList];
    if (!current.some((x: any) => x.id === obj.id)) {
      control?.setValue([...current, obj]);
    }
  }

  removeControl(obj: any) {
    const control = this.formGroup.get('securityControl');
    control?.setValue((control?.value || []).filter((x: any) => x.id !== obj.id));
  }


}
