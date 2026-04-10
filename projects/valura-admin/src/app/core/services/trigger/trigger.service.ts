import { inject, Injectable } from '@angular/core';
import { DbService } from '../db/db.service';
import { DownloadConfigService } from '../download/download-config.service';
import { RegulationsTrigger } from '@admin-core/models/configuration/regulation';

@Injectable({
  providedIn: 'root'
})
export class TriggerService {

  triggerMasterList: RegulationsTrigger[] = []

  constructor() { }


  private dbService = inject(DbService);
  private downloadConfigService = inject(DownloadConfigService);

  async getTriggerMasterList(forceLoad: boolean = false) {
    let triggerList = await this.dbService.getAllTriggers();

    if (forceLoad || !triggerList?.length) {
      const res = await this.downloadConfigService.getTriggersList();
      let _triggerList = await this.dbService.getAllTriggers();
      triggerList = [..._triggerList]
    }

    this.triggerMasterList = [...triggerList]
    return triggerList ?? []
  }

  async addTrigger(trigger: RegulationsTrigger) {
    this.dbService.addTrigger(trigger)
  }

  createTriggerObj(trigger: RegulationsTrigger) {
    const newTrigger: RegulationsTrigger = {
      ...trigger
    };
    return newTrigger
  }

  async createAndNewTrigger(trigger: RegulationsTrigger) {
    const newTrigger = this.createTriggerObj(trigger)
    await this.addTrigger(newTrigger);
    return newTrigger
  }

  async updateTriggerToDb(trigger: RegulationsTrigger) {
    await this.dbService.updateTrigger(trigger);
  }

  async deleteTrigger(triggerId: number) {
    await this.dbService.deleteTriggers(triggerId);
  }

  async getActsTriggerList(actId: number) {
    let triggerList = await this.dbService.getTriggerByActId(actId);
    return triggerList;
  }

  async getTriggerById(id: number) {
    let trigger = null;
    trigger = await this.dbService.getTriggersById(id);
    return trigger
  }
}

