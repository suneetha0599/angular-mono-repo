import { inject, Injectable } from '@angular/core';
import { FormConfiguration, FormConfigurationData, RequesterLabelInfo } from '@admin-core/models/configuration/FormConfiguration';
import { dsrRequestTypes, SELF, THIRD_PARTY } from '@admin-page/request-management/constant';
import { ConfigService } from '../config.service';
import { NGXLogger } from 'ngx-logger';

@Injectable({
  providedIn: 'root'
})
export class CreateRequestService {

  constructor() { }

  private configService = inject(ConfigService);
  private logger = inject(NGXLogger)

  async prepareInitialFormConfiguration() {
    let _mainConfiguration = new FormConfiguration();
    let _formConfiguration = new FormConfigurationData();

    const res = await this.configService.getDsrConfiguration();

    if (!res) {
      this.logger.error('DSR Configuration API returned empty or null data');
      return { _mainConfiguration, _formConfiguration }
    }
    this.logger.debug('DSR Configuration received', res);
    _mainConfiguration = new FormConfiguration(res);
    const formConfiguration = new FormConfigurationData(res);
    const _requesterInfo: RequesterLabelInfo[] = [];
    if (res?.requesterInfo?.myself) {
      _requesterInfo.push({ ...res.requesterInfo.myself, type: SELF, label: dsrRequestTypes[0].name, icon: 'person_outlined', description: res.requesterInfo.myself.overridden })
    }
    if (res?.requesterInfo?.thirdParty) {
      _requesterInfo.push({ ...res.requesterInfo.thirdParty, type: THIRD_PARTY, label: dsrRequestTypes[1].name, icon: 'groups', description: res.requesterInfo.myself.overridden })
    }
    formConfiguration.requesterInfo = _requesterInfo;

    //Data subject
    const dataSubjectMasterList: any = res?.dataSubjectRequestUserTypeList ?? []
    formConfiguration.dataSubjectUserTypesList = [...dataSubjectMasterList];

    //Channel
    const channelList: any[] = res?.channelList ?? [];
    formConfiguration.channelList = channelList;

    const countryMasterList: any = res?.countryList ?? [];
    formConfiguration.countryMasterList = countryMasterList;
    formConfiguration.filteredCountryList = [...countryMasterList];
    formConfiguration.filteredThirdPartyCountryList = [...countryMasterList];
    formConfiguration.filteredDataSubjectPhoneList = [...countryMasterList];


    return formConfiguration
  }


}
