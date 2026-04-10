import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { Subscription, take } from 'rxjs';
import { AssessmentRiskListComponent } from '../assessments/assessment-risk-list/assessment-risk-list.component';
import { RiskViewDrawerComponent } from '../assessments/assessment-risk-list/risk-view-drawer/risk-view-drawer.component';
import { RiskViewDrawerService, RiskViewPayload, RiskTaskPayload } from '@admin-core/services/risk-view-drawer/risk-view-drawer.service';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { CreateTaskDrawerComponent } from '@admin-page/request-management/request-management-details/request-details-stages/create-task-drawer/create-task-drawer.component';

@Component({
  selector: 'app-assessment-risk-master',
  imports: [AssessmentRiskListComponent, MatSidenavModule, RiskViewDrawerComponent, CreateTaskDrawerComponent],
  templateUrl: './assessment-risk-master.component.html',
  styleUrl: './assessment-risk-master.component.scss'
})
export class AssessmentRiskMasterComponent implements OnInit, OnDestroy {

  @ViewChild('riskViewDrawer') riskViewDrawer!: MatDrawer;
  @ViewChild('riskViewDrawer', { read: ElementRef }) riskViewDrawerEl!: ElementRef;
  @ViewChild(RiskViewDrawerComponent) riskViewDrawerComponent!: RiskViewDrawerComponent;

  @ViewChild('createTaskDrawer') createTaskDrawer!: MatDrawer;
  @ViewChild('createTaskDrawer', { read: ElementRef }) createTaskDrawerEl!: ElementRef;
  @ViewChild(CreateTaskDrawerComponent) createTaskDrawerComponent!: CreateTaskDrawerComponent;

  riskViewData: any = null;
  riskViewPayload: RiskViewPayload | null = null;
  createTaskRiskData: RiskTaskPayload | null = null;
  private _riskViewPayloadBeforeTaskCreate: RiskViewPayload | null = null;
  isVendorContext: boolean = false;

  private riskViewDrawerService = inject(RiskViewDrawerService);
  private router = inject(Router);
  private subs = new Subscription();

  ngOnInit(): void {

    this.isVendorContext = this.router.url.includes(routeConstants.VENDORS);
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
    this.subs.add(
      this.riskViewDrawerService.createTask$.subscribe((payload: RiskTaskPayload) => {
        this.createTaskRiskData = payload;

        const openTaskDrawer = () => {
          this.createTaskDrawer?.open();
          setTimeout(() => {
            const el = this.createTaskDrawerEl?.nativeElement as HTMLElement;
            if (el) {
              el.style.setProperty('width', '62vw', 'important');
              el.style.setProperty('min-width', '62vw', 'important');
              el.style.setProperty('max-width', '62vw', 'important');
              el.style.setProperty('height', '100vh', 'important');
            }
            this.createTaskDrawerComponent?.onDrawerOpened();
          }, 0);
        };

        if (this.riskViewDrawer?.opened) {
          this._riskViewPayloadBeforeTaskCreate = this.riskViewPayload;
          this.riskViewDrawer.closedStart.pipe(take(1)).subscribe(() => {
            setTimeout(() => openTaskDrawer(), 420);
          });
          this.riskViewDrawer.close();
        } else {
          openTaskDrawer();
        }
      })
    );
  }

  closeRiskViewDrawer(): void {
    this.riskViewDrawer.close();
  }

  onRiskViewEdit(riskData: any): void {
    this.riskViewDrawer.close();
    this.riskViewDrawerService.triggerEdit(riskData);
  }

  onRiskViewDelete(riskData: any): void {
    this.riskViewDrawer.close();
    this.riskViewDrawerService.triggerDelete(riskData);
  }

  onRiskViewCreateTask(riskData: any): void {
    this.riskViewDrawerService.triggerCreateTask({
      riskData,
      assessmentId: this.riskViewPayload?.assessmentId ?? 0,
      sections: this.riskViewPayload?.sections ?? [],
      risks: [riskData],
      source: 'RISK_VIEW_DRAWER',
    });
  }

  onRiskViewRefresh(): void {
    this.riskViewDrawerService.notifyTaskSaved();
  }

  closeCreateTaskDrawer(): void {
    this.createTaskDrawer?.close();
    this.createTaskRiskData = null;
  }

  onCreateTaskSaved(event: any): void {
    this.createTaskDrawer?.close();
    this.createTaskRiskData = null;
    this.riskViewDrawerService.notifyTaskSaved();
  }

  onNavigateToTask(event: { taskId: number; messageId: number }): void {
    const assessmentId = this.riskViewPayload?.assessmentId;
    if (!assessmentId) return;
    this.riskViewDrawer?.close();
    this.router.navigate(
      ['/', routeConstants.USER, routeConstants.ASSESSMENTS, routeConstants.ASSESSMENT, routeConstants.ASSESSMENT_DETAILS, assessmentId],
      { queryParams: { tab: 'TASKS', taskId: event.taskId } }
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
