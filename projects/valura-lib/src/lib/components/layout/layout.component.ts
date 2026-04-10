import { Component, inject } from '@angular/core';
import { TopbarComponent } from './topbar/topbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { DataSyncService } from '@admin-core/services/download/data-sync.service';
import { NeedsActionsService } from '@admin-core/services/actions/needs-actions.service';
@Component({
  selector: 'layout',
  imports: [TopbarComponent, SidebarComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {

  collapsed = false;

  private dataSyncService = inject(DataSyncService);
  private needsActionsService = inject(NeedsActionsService);
  constructor() { }

  ngOnInit(): void {
    this.dataSyncService.startSync();
    this.needsActionsService.start();
  }

  toggleSidebar(): void {
    this.collapsed = !this.collapsed;
  }

  ngOnDestroy() {
    this.dataSyncService.stopSync();
    this.needsActionsService.stop();
  }
}
