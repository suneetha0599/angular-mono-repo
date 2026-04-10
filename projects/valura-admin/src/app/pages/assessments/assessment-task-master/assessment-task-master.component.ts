import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AssessmentTaskListComponent } from '../assessments/assessment-task-list/assessment-task-list.component';
import { RiskViewDrawerComponent } from '../assessments/assessment-risk-list/risk-view-drawer/risk-view-drawer.component';
import { RiskViewDrawerService, RiskViewPayload } from '@admin-core/services/risk-view-drawer/risk-view-drawer.service';

@Component({
  selector: 'app-assessment-task-master',
  imports: [AssessmentTaskListComponent, MatSidenavModule, RiskViewDrawerComponent],
  templateUrl: './assessment-task-master.component.html',
  styleUrl: './assessment-task-master.component.scss'
})
export class AssessmentTaskMasterComponent implements OnInit, OnDestroy {

  @ViewChild('riskViewDrawer') riskViewDrawer!: MatDrawer;
  @ViewChild('riskViewDrawer', { read: ElementRef }) riskViewDrawerEl!: ElementRef;
  @ViewChild(RiskViewDrawerComponent) riskViewDrawerComponent!: RiskViewDrawerComponent;
  @ViewChild(AssessmentTaskListComponent) taskListComponent!: AssessmentTaskListComponent;

  riskViewData: any = null;
  riskViewPayload: RiskViewPayload | null = null;
  pendingTaskId: number | null = null;
  pendingConversationId: number | null = null;

  private riskViewDrawerService = inject(RiskViewDrawerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subs = new Subscription();

  ngOnInit(): void {
    this.subs.add(
      this.route.queryParams.subscribe(params => {
        const taskId = params['taskId'];
        const conversationId = params['conversationId'];
        if (taskId) {
          this.pendingTaskId = +taskId;
          this.pendingConversationId = conversationId ? +conversationId : null;
          if (this.taskListComponent) {
            setTimeout(() => {
              this.taskListComponent.openTaskDrawer(
                { taskId: +taskId },
                this.pendingConversationId
              );
            }, 500);
          }
          this.router.navigate([], { queryParams: { taskId: null, conversationId: null }, queryParamsHandling: 'merge', replaceUrl: true });
        }
      })
    );
    this.subs.add(
      this.riskViewDrawerService.open$.subscribe((payload: RiskViewPayload) => {
        this.riskViewData = payload.riskData;
        this.riskViewPayload = payload;
        this.riskViewDrawer.open();
        setTimeout(() => {
          const el = this.riskViewDrawerEl?.nativeElement as HTMLElement;
          if (el) {
            el.style.setProperty('width', '50vw', 'important');
            el.style.setProperty('min-width', '50vw', 'important');
            el.style.setProperty('max-width', '50vw', 'important');
            el.style.setProperty('height', '100vh', 'important');
          }
          this.riskViewDrawerComponent?.onDrawerOpened();
        }, 0);
      })
    );
    this.subs.add(
      this.riskViewDrawerService.close$.subscribe(() => this.riskViewDrawer?.close())
    );
  }

  closeRiskViewDrawer(): void {
    this.riskViewDrawer.close();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
