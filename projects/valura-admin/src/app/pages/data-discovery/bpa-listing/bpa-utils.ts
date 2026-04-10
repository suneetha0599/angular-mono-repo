import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import {
  AssetPdElementMapping,
  BpaDataSubject, BpaDepartment,
  Country,
  DataSubjectPdElemementMapping,
  LegalBasis,
  PdElementMapping,
  Purpose,
  RecipientPdElementMapping,
  SourcetPdElementMapping
} from "@admin-core/models/data-inventory/BPA";
import { Sensitivity } from "./constants";
import { Edge, Node } from "@swimlane/ngx-graph";
import {
  BpaPayload,
  BpaSourceMapping as BpaSourcePayload,
  BpaAssetMapping as BpaAssetPayload,
  RecipientMapping,
  BpaUpdatePayload,
  AssetBpaMappingPayload,
  SourceBpaMappingPayload,
  PdMappingPayload,
  RecipientBpaMappingPayload,
  PurposeMappingPayload,
  RegionMappingPayload,
  DataSubjectTypeMappingPayload,
  SourcePdMappingPayload,
  AssetPdMappingPayload,
  RecipientPdMappingPayload
} from "@admin-core/models/data-inventory/BpaPayload";

export const displayStatusText = (status: string): string => {
  if (!status) return '';
  const formatted = status.replace(/_/g, ' ')

  const parts = formatted.split(' ');
  return parts[parts.length - 1];
}

export const sensitivityColors = (text: string): string => {
  switch (text) {
    case Sensitivity.LOW:
      return `#FFF4E5`;
    case Sensitivity.MEDIUM:
      return `#E5F6FD`;
    case Sensitivity.HIGH:
      return `#FFDAD6`
    default:
      return `#E5F6FD`;
  }
}

export const sensitivityTextColors = (text: string): string => {
  switch (text) {
    case Sensitivity.LOW:
      return `#663C00`;
    case Sensitivity.MEDIUM:
      return `#014361`;
    case Sensitivity.HIGH:
      return `#410002`;
    default:
      return `#014361`;
  }
}
export const buildBpaCreateForm = (fb: FormBuilder) => {

  let form: FormGroup = fb.group({
    overview: fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      owner: [null, Validators.required],
      departmentId: ['', Validators.required],
      // role: [''],
      // subRole: [''],
      // respondentEmail: ['', Validators.required],
      regulations: new FormControl([]),
      purposePurpose: [[]],
      frequencyOfProcessing: [''],
      volumeOfPersonalData: [''],
      legalBasis: [''],
      dataSubjectRegion: [[]],
      tempDataSubjectRegion: [''],
      dataSubjectList: [[]],
      tempDataSubject: [''],
      controllerMappings: [[]],
      controller: fb.array([]),
      processor: fb.array([]),
      jointController: fb.array([]),
      subProcessor: fb.array([]),
      importer: fb.array([]),
      exporter: fb.array([]),
      maxValue: [''],
      minValue: ['']
    }),
    dataElements: fb.group({
      selectedPurpose: new FormControl({ value: '', disabled: true }),
      showPurposeSection: new FormControl(false),
      dataSubjectPdElementMapping: fb.array([]),
    }),
    source: fb.group({
      sourcePdElementsMapping: fb.array([]),
    }),
    asset: fb.group({
      assetElementsMapping: fb.array([]),
    }),
    recipients: fb.group({
      recipientsPdElementsMapping: fb.array([])
    }),
    dataFlow: fb.group({

    }),
    securityMeasures: fb.group({
      retentionPeriod: [''],
      securityControl: [''],
      standard: [''],
      controlCategory: [''],
      controlDescription: [''],
      days: ['']
    }),
    riskSummary: fb.group({

    })
  });
  return form;
}



export const buildDataSubjectMapping = (fb: FormBuilder, dataSubjectPdElemementMapping: DataSubjectPdElemementMapping, isEditMode: boolean = true) => {
  const pdElementMappingList = dataSubjectPdElemementMapping.pdElementMappingList;
  const dataSubject = dataSubjectPdElemementMapping?.dataSubjectType
  let form: FormGroup = fb.group({
    dataSubjectType: new FormControl(dataSubject),
    pdElementMappingList: fb.array(pdElementMappingList.map((pdElementMapping: PdElementMapping) => buildPdElementsForm(fb, { ...pdElementMapping, dataSubject: pdElementMapping?.dataSubject ? pdElementMapping?.dataSubject : dataSubject }, true, isEditMode))),
  });
  return form;
}

export const buildPdElementsForm = (fb: FormBuilder, pdElemementMapping: PdElementMapping, dataElementSection: boolean = false, isEditMode: boolean = true) => {
  let form: FormGroup = fb.group({
    selected: new FormControl({ value: dataElementSection ? false : pdElemementMapping?.selected ?? false, disabled: !isEditMode }),
    pdElement: new FormControl(pdElemementMapping?.pdElement ?? ''),
    dataSubject: new FormControl(pdElemementMapping?.dataSubject ?? ''),
    newAdded: new FormControl(pdElemementMapping?.newAdded ?? false),
    id: new FormControl(pdElemementMapping?.id ?? 0),
  });
  const pdElemementPurposeMapping = pdElemementMapping.purpose?.length ? pdElemementMapping.purpose.map((purpose: Purpose) => {
    return {
      id: purpose?.id ?? 0,
      purposeName: purpose?.purposeName ?? '',
      pdBpaPurposeMappingId: purpose?.pdBpaPurposeMappingId ?? 0,
    };
  }) : '';
  form.addControl('purpose', new FormControl(pdElemementPurposeMapping, { validators: dataElementSection ? [Validators.required] : [] }));
  form.addControl('originalPurposeMappingList', new FormControl(pdElemementMapping?.originalPurposeMappingList ?? ''))
  return form;
}

export const buildSourceForm = (fb: FormBuilder, sourcetPdElementMapping: SourcetPdElementMapping) => {
  const pdElementMappingList = sourcetPdElementMapping.pdElementMappingList
  const dataSubjectList = getDataSubjectMasterList(pdElementMappingList);

  let form: FormGroup = fb.group({
    id: new FormControl(sourcetPdElementMapping?.id ?? 0),
    source: new FormControl(sourcetPdElementMapping?.source),
    type: new FormControl(sourcetPdElementMapping?.type ?? '', [Validators.required]),
    pdElementMappingList: fb.array(pdElementMappingList.map((pdElementMapping: PdElementMapping) => buildPdElementsForm(fb, { ...pdElementMapping }))),
    // sourceNewPdElementMasterList: fb.array(sourceNewPdElementMasterList.map((pdElementMapping: PdElementMapping) => buildPdElementsForm(fb, { ...pdElementMapping }))),
  });
  form.addControl('dataSubject', new FormControl(dataSubjectList?.length ?
    dataSubjectList.map((ds: BpaDataSubject) => {
      return {
        id: ds?.id ?? 0,
        name: ds?.name ?? '',
      };
    }) : ''
  ));
  return form;
}

export const buildRecipientForm = (fb: FormBuilder, recipient: any) => {
  const dataSubjectList = getDataSubjectMasterList(recipient?.pdElementMappingList ?? []);
  const recipientData = { ...recipient?.recipient, recipientBpaMappingId: recipient?.id };

  let form: FormGroup = fb.group({
    id: new FormControl(recipient?.id ?? 0),
    type: new FormControl(recipient?.type ?? ''),
    recipient: new FormControl(recipientData),
    numberOfPersonHavingAccess: new FormControl(recipient?.numberOfPersonHavingAccess ?? ''),
    purpose: new FormControl(recipient?.purpose ?? ''),
    pdElementMappingList: fb.array((recipient?.pdElementMappingList ?? []).map((pdElementMapping: PdElementMapping) => buildPdElementsForm(fb, { ...pdElementMapping }))),
  });

  form.addControl('dataSubject', new FormControl(dataSubjectList?.length ?
    dataSubjectList.map((ds: BpaDataSubject) => {
      return {
        id: ds?.id ?? 0,
        name: ds?.name ?? '',
      };
    }) : ''
  ));
  return form;
}

export const buildAssetForm = (fb: FormBuilder, assetPdElementMapping: AssetPdElementMapping) => {
  const pdElementMappingList = assetPdElementMapping.pdElementMappingList;
  const dataSubjectList = getDataSubjectMasterList(pdElementMappingList);
  const asset = { ...assetPdElementMapping?.asset, assetBpaMappingId: assetPdElementMapping?.id };

  let form: FormGroup = fb.group({
    id: new FormControl(assetPdElementMapping?.id ?? 0),
    asset: new FormControl(asset),
    pdElementMappingList: fb.array(pdElementMappingList.map((pdElementMapping: PdElementMapping) => buildPdElementsForm(fb, { ...pdElementMapping }))),
    // assetNewPdElementMasterList: fb.array(assetNewPdElementMasterList.map((pdElementMapping: PdElementMapping) => buildPdElementsForm(fb, { ...pdElementMapping }))),
  });

  form.addControl('dataSubject', new FormControl(dataSubjectList?.length ?
    dataSubjectList.map((ds: BpaDataSubject) => {
      return {
        id: ds?.id ?? 0,
        name: ds?.name ?? '',
      };
    }) : ''
  ));
  return form;
}

export const getPdElementMasterList = (dataSubjectPdElemementMapping: DataSubjectPdElemementMapping[]) => {
  let pdElementMasterList: PdElementMapping[] = [];
  for (const dsPdElemementMapping of dataSubjectPdElemementMapping) {
    for (const pdElementMapping of dsPdElemementMapping.pdElementMappingList) {
      let find = pdElementMasterList.find(pdEle => (pdEle.pdElement?.id == pdElementMapping.pdElement?.id) && (pdEle.dataSubject?.id == pdElementMapping.dataSubject?.id));
      if (find) {
        continue
      }
      pdElementMasterList.push(pdElementMapping)
    }
  }
  return pdElementMasterList
}


export const getDataSubjectMasterList = (pdElementMapping: PdElementMapping[]) => {
  let dataSubjectList: any[] = [];
  for (const pdEle of pdElementMapping) {
    let find = dataSubjectList.find(ds => ds?.id == pdEle.dataSubject?.id);
    if (find) {
      continue
    }
    dataSubjectList.push(pdEle.dataSubject)
  }
  return dataSubjectList
}

export const buildDataForDFD = (data: any) => {
  const nodes: Node[] = [];
  const links: Edge[] = [];

  //  Data Subjects
  data.overview.dataSubjectList.forEach((ds: BpaDataSubject) => {
    const nodeData = getNodeData({ id: `ds-${ds.id}`, label: ds.name, key: DATA_DFD_KEY.DS })
    nodes.push(nodeData);
  });

  // Sources
  data.source.sourcePdElementsMapping.forEach((s: SourcetPdElementMapping) => {
    const pdCount = s.pdElementMappingList?.length ?? 0;
    const nodeData = getNodeData({
      id: `source-${s.source?.id}`,
      label: s.source?.name ?? '',
      key: DATA_DFD_KEY.SOURCE,
      count: pdCount,
      category: s.source?.category ?? '',
      type: s.type ?? ''
    });

    nodes.push(nodeData);
  });

  // Assets
  data.asset.assetElementsMapping.forEach((a: AssetPdElementMapping) => {
    const pdCount = a.pdElementMappingList?.length ?? 0;
    // const hostingLocationIds =
    //   a.asset?.hostingSite?.length
    //     ? a.asset.hostingSite.map((h: { location: any; }) => h.location)
    //     : [];
    const tempHostingSites = a?.asset?.hostingSite || [];
    const hostingSites = tempHostingSites.map((h: any) =>
      typeof h === 'object' && h?.hostingSite ? h.hostingSite : h
    );
    const dataSubjectLength = a.dataSubject?.length ?? 0;
    const nodeData = getNodeData({
      id: `asset-${a.asset?.id}`,
      label: a.asset?.name ?? '',
      key: DATA_DFD_KEY.ASSET,
      count: pdCount,
      hostingLocation: hostingSites,
      dataSubjectLength,
      type: a.asset?.type ?? ''
    });

    nodes.push(nodeData);
  });

  data.recipients.recipientsPdElementsMapping.forEach((r: RecipientPdElementMapping) => {
    const recipientId = r.recipient?.id ?? r.recipient?.vendorId;
    const numberOfPeople = r?.numberOfPersonHavingAccess;
    const type = r?.type
    if (!recipientId) return;
    const pdCount = r.pdElementMappingList?.length;
    const nodeData = getNodeData({
      id: `recipient-${recipientId}`,
      label: (r.recipient?.name ?? r.recipient ?? ''),
      key: DATA_DFD_KEY.RECIPIENT,
      count: pdCount,
      type: type,
      numberOfPeopleHavingAccess: numberOfPeople
    });
    nodes.push(nodeData);
  });

  // Connect each Data Subject -> each Source
  data.overview.dataSubjectList.forEach((ds: BpaDataSubject) => {
    data.source.sourcePdElementsMapping.forEach((s: SourcetPdElementMapping) => {
      links.push({ source: `ds-${ds.id}`, target: `source-${s.source?.id}`, label: '', data: { linkText: '' } });
    });
  });

  //  Connect each Source -> corresponding Asset
  data.source.sourcePdElementsMapping.forEach((s: SourcetPdElementMapping) => {
    data.asset.assetElementsMapping.forEach((a: AssetPdElementMapping) => {
      links.push({ source: `source-${s.source?.id}`, target: `asset-${a.asset?.id}`, label: '', data: { linkText: '' } })
    });
  });

  (data.asset?.assetElementsMapping || []).forEach((a: AssetPdElementMapping) => {
    if (!a.asset?.id) return;

    (data.recipients?.recipientsPdElementsMapping || []).forEach((r: RecipientPdElementMapping) => {
      const recipientId = r.recipient?.id ?? r.recipient?.vendorId;
      if (!recipientId) return;

      links.push({
        source: `asset-${a.asset?.id}`,
        target: `recipient-${recipientId}`,
        label: '',
        data: { linkText: '' }
      });
    });
  });


  return { nodes, links };
}

export enum DATA_DFD_KEY {
  DS = "DS",
  SOURCE = "SOURCE",
  ASSET = "ASSET",
  RECIPIENT = "RECIPIENT",
}

const getNodeData = (nodeData: any) => {
  const key = nodeData?.key ?? ''
  const borderRadius = key == DATA_DFD_KEY.DS ? 40 : 8;
  const minWidth = key == DATA_DFD_KEY.DS ? 'unset' : 200;
  const countType = key == DATA_DFD_KEY.DS ? '' : 'Data Elements';

  let icon = '', count = '', backgroundColor = '#ffffff', borderColor = '#1C2B70';
  if (key == DATA_DFD_KEY.SOURCE) {
    icon = 'downloading'
    count = nodeData?.count
    borderColor = '#F18810'
  }
  else if (key == DATA_DFD_KEY.ASSET) {
    icon = 'dns'
    count = nodeData?.count
    borderColor = '#BA1A1A'
  }
  else if (key == DATA_DFD_KEY.RECIPIENT) {
    icon = 'bubble'
    count = nodeData?.count
    borderColor = '#28A745'
  }
  return {
    ...nodeData,
    data: {
      count: count,
      countType: countType,
      keyType: "",
      type: "",
      backgroundColor: backgroundColor,
      borderColor: borderColor,
      borderRadius: borderRadius,
      icon: icon,
      minWidth: minWidth,
    }
  }
}

export const prepareBpaPayload = (data: any, id: number) => {
  let payload: BpaPayload;
  payload = {
    ...data.overview,
    id: (id ? id : 0),

  }
  payload.dataSubjectIds = data.overview.dataSubjectList.map((ds: BpaDataSubject) => ds.id);

  payload.owner = data.overview.owner ? { ...data.overview.owner, id: data.overview.owner.userId } : null
  payload.purposes = data.overview.purposePurpose.map((p: Purpose) => p.id);
  const legalBasis = data.overview.legalBasis;
  payload.legalBasis = Array.isArray(legalBasis) ? legalBasis.map((l: any) => l.id) : legalBasis ? [legalBasis.id] : [];
  payload.departmentId = (data.overview.departmentId?.id ?? 0);
  payload.dataSubjectRegionIds = (data.overview.dataSubjectRegion.map((r: any) => r.id))
  const min = data.overview.minValue || 0;
  const max = data.overview.maxValue || 100000;
  payload.volumeOfPersonalData = `${min}-${max}`;

  // Pd elemenst mapping
  payload.pdMappings = [];
  for (const dsPdMapping of data.dataElements.dataSubjectPdElementMapping) {
    dsPdMapping.pdElementMappingList.map((pd: PdElementMapping) => {
      const purposeIds = pd.purpose?.length ? pd.purpose.map((p: Purpose) => p.id) : [];
      const pdMapping = {
        "pdElementId": pd.pdElement?.id ?? 0,
        "dsId": pd.dataSubject?.id ?? 0,
        "purposeId": purposeIds
      }
      payload.pdMappings.push(pdMapping);
    });
  }
  //Source
  payload.bpaSources = [];
  data.source.sourcePdElementsMapping.map((s: SourcetPdElementMapping) => {
    const sourceId = s.source?.tempSourceId ? s.source?.tempSourceId : (s.source?.id ?? 0)
    const source: BpaSourcePayload = {
      sourceId: sourceId,
      pdMappings: []
    };
    source.pdMappings = s.pdElementMappingList.map((pd: PdElementMapping) => {
      return {
        "pdElementId": pd.pdElement?.id ?? 0,
        "dsId": pd.dataSubject?.id ?? 0,
      }
    });
    payload.bpaSources.push(source)
  });

  // Assets
  payload.assetMappings = [];
  data.asset.assetElementsMapping.map((a: AssetPdElementMapping) => {
    const asset: BpaAssetPayload = {
      assetId: a.asset?.id ?? 0,
      pdMappings: []
    };
    asset.pdMappings = a.pdElementMappingList.map((pd: PdElementMapping) => {
      return {
        "pdElementId": pd.pdElement?.id ?? 0,
        "dsId": pd.dataSubject?.id ?? 0,
      }
    });
    payload.assetMappings.push(asset)
  });


  // Recipients
  payload.recipientMappings = [];
  data.recipients.recipientsPdElementsMapping.map((r: RecipientPdElementMapping) => {
    const recipient: RecipientMapping = {
      "entityType": r.type,
      "entityId": r.recipient?.id ?? 0,
      "numberOfPersonHavingAccess": r.numberOfPersonHavingAccess ? r.numberOfPersonHavingAccess : 0,
      "purpose": r.purpose,
      pdMappings: []
    }
    recipient.pdMappings = (r.pdElementMappingList ?? []).map((pd: PdElementMapping) => {
      return {
        "pdElementId": pd.pdElement?.id ?? 0,
        "dsId": pd.dataSubject?.id ?? 0,
      }
    });
    payload.recipientMappings.push(recipient)
  });

  //Security controls
  payload.retentionPeriod = `${data.securityMeasures.days} ${data.securityMeasures.retentionPeriod}`;

  payload.securityMeasures = (data.securityMeasures.securityControl)?.length ? data.securityMeasures.securityControl.map((s: any) => s.id) : [];

  // securityControl: (data.securityMeasures.securityControl || []).map((s: any) =>
  //   typeof s === 'object' && s !== null ? s.name : s
  // ),
  // standard: data.securityControls.standard,
  // controlCategory: data.securityControls.controlCategory,
  // controlDescription: data.securityControls.controlDescription,
  // prefixValue: data.securityControls.prefixValue


  return payload;
}


export const findPdElementIndexInAnySource = (data: any, type: string, pdElementMapping: PdElementMapping) => {
  // Source
  let indexData: any[] = [];

  if (type == 'source') {
    for (const [i, source] of data.source.sourcePdElementsMapping.entries()) {
      const index = source.pdElementMappingList.findIndex((pd: PdElementMapping) => pd.pdElement?.id === pdElementMapping.pdElement?.id && pd.dataSubject?.id == pdElementMapping.dataSubject?.id);
      if (index > -1) {
        indexData.push({ type: 'source', parentIndex: i, index });
      }
    }
  }

  // Asset
  if (type == 'asset') {
    for (const [i, asset] of data.asset.assetElementsMapping.entries()) {
      const index = asset.pdElementMappingList.findIndex((pd: PdElementMapping) => pd.pdElement?.id === pdElementMapping.pdElement?.id && pd.dataSubject?.id == pdElementMapping.dataSubject?.id);
      if (index > -1) {
        indexData.push({ type: 'asset', parentIndex: i, index });
      }
    }
  }

  // Recipient
  if (type == 'recipient') {
    for (const [i, recipient] of data.recipients.recipientsPdElementsMapping.entries()) {
      const index = recipient.pdElementMappingList.findIndex((pd: PdElementMapping) => pd.pdElement?.id === pdElementMapping.pdElement?.id && pd.dataSubject?.id == pdElementMapping.dataSubject?.id);
      if (index > -1) {
        indexData.push({ type: 'recipient', parentIndex: i, index });
      }
    }
  }

  return indexData; // not found anywhere
};

export const prepareUpdateBpaPayload = (data: any, id: number) => {
  let payload: BpaUpdatePayload;
  payload = {
    ...data.overview,
    id: (id ? id : 0),
  }

  // data subject
  payload.dataSubjectIds = data.overview.dataSubjectList?.map((dataSubject: any) => prepareDataSubjectMappingDataPayload(dataSubject)) || [];
  payload.owner = data.overview.owner ? { ...data.overview.owner, id: data.overview.owner.userId } : null

  // Purpose
  payload.bpaPurposes = data.overview.purposePurpose?.map((purpose: any) =>
    prepareBpaPurposeMappingDataPayload(purpose)) || [];

  //legal basis
  const legalBasisArr = Array.isArray(data.overview.legalBasis) ? data.overview.legalBasis : data.overview.legalBasis ? [data.overview.legalBasis] : [];
  payload.legalBasis = legalBasisArr.map((legal: LegalBasis) => ({
    legalBasisId: legal.id,
    legalBasisIdBpaMappingId: legal.mappingId ?? 0,
    isDeleted: false
  }));

  // Deleted legal basis data
  if (data?.originalBpaLegalBasisData?.length) {
    for (const legalBasis of data?.originalBpaLegalBasisData) {
      let find = payload.legalBasis.find(_legal => (_legal.legalBasisIdBpaMappingId == legalBasis.mappingId) && legalBasis.mappingId);
      if (find) {
        continue
      }
      payload.legalBasis.push({
        legalBasisId: legalBasis.id,
        legalBasisIdBpaMappingId: legalBasis.mappingId ?? 0,
        isDeleted: true
      });
    }
  }
  // Datasubject regions
  const currentRegions = data.overview.dataSubjectRegion || [];
  const originalRegions = data.originalRegions || [];
  payload.dataSubjectRegionIds = [

    ...currentRegions.map((region: any) => ({
      dsRegionId: region.id,
      dsRegionBpaMappingId: region.dsRegionBpaMappingId || 0,
      isDeleted: false
    })),
    ...originalRegions
      .filter((orig: any) => !currentRegions.some((curr: any) => curr.id === orig.id))
      .map((deleted: any) => ({
        dsRegionId: deleted.id,
        dsRegionBpaMappingId: deleted.dsRegionBpaMappingId || 0,
        isDeleted: true
      }))
  ];

  // payload.dataSubjectRegionIds = data.overview.dataSubjectRegion?.map((region: any) =>
  //   prepareRegionMappingDataPayload(region)) || [];

  const currentDS = data.overview.dataSubjectList || [];
  const originalDS = data.originalDataSubjects || [];

  payload.dataSubjectIds = [
    ...currentDS.map((ds: any) => ({
      dsId: ds.id,
      dsBpaMappingId: ds.dsBpaMappingId || 0,
      isDeleted: false
    })),
    ...originalDS
      .filter((orig: any) => !currentDS.some((curr: any) => curr.id === orig.id))
      .map((deleted: any) => ({
        dsId: deleted.id,
        dsBpaMappingId: deleted.dsBpaMappingId || 0,
        isDeleted: true
      }))
  ];

  // ControllerMapping
  payload.controllerMappings =
    data.overview.controllerMappings?.map((controller: any) => ({
      id: controller.id ?? 0,
      controllerMappingId: controller.id || 0,
      name: controller.name,
      type: controller.type,
      isDeleted: controller.isDeleted || false,
      isUpdated: controller.isUpdated || false,
    }))

  payload.departmentId = (data.overview.departmentId?.id ?? 0);
  const min = data.overview.minValue || 0;
  const max = data.overview.maxValue || 100000;
  payload.volumeOfPersonalData = `${min}-${max}`;

  // Pd elemenst mapping
  payload.pdMappings = [];
  for (const dsPdMapping of data.dataElements.dataSubjectPdElementMapping) {
    dsPdMapping.pdElementMappingList.map((pdEleMapping: PdElementMapping) => {
      const pdMapping: PdMappingPayload = preparePdMappingDataPayload(dsPdMapping.dataSubjectType, pdEleMapping)
      payload.pdMappings.push(pdMapping);
    });
  }

  //Source
  payload.sourcePdElementsMappings = [];
  data.source.sourcePdElementsMapping.map((sourcetPdElementMapping: SourcetPdElementMapping) => {
    const source: SourceBpaMappingPayload = prepareSourceMappingDataPayload(sourcetPdElementMapping, false, data.deletedSourcePdMappingList)
    payload.sourcePdElementsMappings.push(source)
  });

  // Assets
  payload.assetPdElementsMappings = [];
  data.asset.assetElementsMapping.map((assetPdElementMapping: AssetPdElementMapping) => {
    const asset: AssetBpaMappingPayload = prepareAssetMappingDataPayload(assetPdElementMapping, false, data.deletedAssetPdMappingList)
    payload.assetPdElementsMappings.push(asset)
  });

  // Recipients
  payload.recipientPdElementsMappings = [];
  data.recipients.recipientsPdElementsMapping.map((recipientPdElementMapping: RecipientPdElementMapping) => {
    const recipient: RecipientBpaMappingPayload = prepareRecepientMappingDataPayload(recipientPdElementMapping, false, data.deletedRecipientPdMappingList)
    payload.recipientPdElementsMappings.push(recipient)
  });

  //Security controls
  payload.retentionPeriod = `${data.securityMeasures.days} ${data.securityMeasures.retentionPeriod}`;
  payload.securityMeasures = (data.securityMeasures.securityControl)?.length ? data.securityMeasures.securityControl.map((s: any) => s.id) : [];

  return payload;
}

export const preparePdMappingDataPayload = (dataSubject: BpaDataSubject, pdElementMapping: PdElementMapping, isDeleted: boolean = false): PdMappingPayload => {
  const purposeMapping: any = pdElementMapping.purpose?.length ? pdElementMapping.purpose.map((p: Purpose) => ({
    purposeId: p.id,
    pdBpaPurposeMappingId: (p?.pdBpaPurposeMappingId ?? 0),
    isDeleted: isDeleted,
  })) : [];
  const purposeMappingIds = new Set(purposeMapping.map((item: any) => item.pdBpaPurposeMappingId));
  const _deletedPurposeList = (pdElementMapping.originalPurposeMappingList ?? []).filter(item => !purposeMappingIds.has(item.pdBpaPurposeMappingId) && item.pdBpaPurposeMappingId);
  const deletedPurposeMapping: any = _deletedPurposeList?.length ? _deletedPurposeList.map((p: Purpose) => ({
    purposeId: p.id,
    pdBpaPurposeMappingId: (p?.pdBpaPurposeMappingId ?? 0),
    isDeleted: true,
  })) : [];

  return {
    dsBpaMapping: {
      dsId: dataSubject.id,
      pdId: pdElementMapping.pdElement?.id ?? 0,
      dsBpaMappingId: dataSubject?.dsBpaMappingId ?? 0,
      isDeleted: isDeleted
    },
    pdElementBpaMapping: {
      pdElementId: pdElementMapping.pdElement?.id ?? 0,
      pdElementBpaMappingId: pdElementMapping.pdElement?.pdBpaMappingId ?? 0,
      isDeleted: isDeleted
    },
    pdBpaPurposeMappings: [...(purposeMapping ?? []), ...(deletedPurposeMapping ?? [])]
  }
}

export const prepareSourceMappingDataPayload = (sourceMapping: SourcetPdElementMapping, isDeleted: boolean = false, deletedSourcePdMappingList: SourcePdMappingPayload[] = []): SourceBpaMappingPayload => {
  const sourceId = isDeleted ? (sourceMapping.source?.id ?? 0) : (sourceMapping.source?.tempSourceId ? sourceMapping.source?.tempSourceId : (sourceMapping.source?.id ?? 0));
  const source: SourceBpaMappingPayload = {
    sourceBpaMapping: {
      sourceBpaMappingId: (sourceMapping?.id ?? 0),
      sourceId: sourceId,
      isDeleted: isDeleted,
    },
    pdElementMappings: []
  };

  source.pdElementMappings = sourceMapping.pdElementMappingList.map((pd: PdElementMapping) =>
    prepareSourcePdMappingPayload(sourceMapping, pd, isDeleted)) || [];

  if (!isDeleted) {  //If isDeleted is false, you have to append deleted pd mapping
    const _deletedSourcePdMappingList = deletedSourcePdMappingList.filter(pdEle => pdEle.sourceBpaMappingId == sourceMapping.source?.sourceBpaMappingId)
    source.pdElementMappings = source.pdElementMappings.concat(_deletedSourcePdMappingList ?? [])
  }
  return source
}

export const prepareSourcePdMappingPayload = (sourceMapping: SourcetPdElementMapping, PdElementMapping: PdElementMapping, isDeleted: boolean = false): SourcePdMappingPayload => {
  const sourcePdMapping: SourcePdMappingPayload = {
    dsId: (PdElementMapping.dataSubject?.id ?? 0),
    pdElementBpaMappingId: PdElementMapping.pdElement?.pdBpaMappingId ?? 0,
    pdElementId: (PdElementMapping.pdElement?.id ?? 0),
    isDeleted: isDeleted,
    sourceBpaMappingId: (sourceMapping.source?.sourceBpaMappingId ?? 0)
  };
  return sourcePdMapping
}

export const prepareAssetMappingDataPayload = (assetMapping: AssetPdElementMapping, isDeleted: boolean = false, deletedAssetPdMappingList: AssetPdMappingPayload[] = []): AssetBpaMappingPayload => {
  const asset: AssetBpaMappingPayload = {
    assetBpaMapping: {
      assetBpaMappingId: (assetMapping?.id ?? 0),
      assetId: (assetMapping.asset?.id ?? 0),
      isDeleted: isDeleted
    },
    pdElementMappings: []
  };
  asset.pdElementMappings = assetMapping.pdElementMappingList.map((pd: PdElementMapping) =>
    prepareAssetPdMappingPayload(assetMapping, pd, isDeleted)) || [];

  if (!isDeleted) {  //If isDeleted is false, you have to append deleted pd mapping
    const _deletedAssetPdMappingList = deletedAssetPdMappingList.filter(pdEle => pdEle.assetBpaMappingId == assetMapping.asset?.assetBpaMappingId)
    asset.pdElementMappings = asset.pdElementMappings.concat(_deletedAssetPdMappingList ?? [])
  }
  return asset
}

export const prepareAssetPdMappingPayload = (assetMapping: AssetPdElementMapping, PdElementMapping: PdElementMapping, isDeleted: boolean = false): AssetPdMappingPayload => {
  const assetPdMapping: AssetPdMappingPayload = {
    dsId: (PdElementMapping.dataSubject?.id ?? 0),
    pdElementAssetMappingId: PdElementMapping.pdElement?.pdBpaMappingId ?? 0,
    pdElementId: (PdElementMapping.pdElement?.id ?? 0),
    isDeleted: isDeleted,
    assetBpaMappingId: (assetMapping.asset?.assetBpaMappingId ?? 0)
  };
  return assetPdMapping
}

export const prepareRecepientMappingDataPayload = (recipientPdElementMapping: RecipientPdElementMapping, isDeleted: boolean = false, deletedRecipientPdMappingList: RecipientPdMappingPayload[] = []): RecipientBpaMappingPayload => {
  const recipient: RecipientBpaMappingPayload = {
    entityType: recipientPdElementMapping.type,
    entityId: recipientPdElementMapping.recipient?.id ?? 0,
    numberOfPersonHavingAccess: recipientPdElementMapping?.numberOfPersonHavingAccess ? recipientPdElementMapping.numberOfPersonHavingAccess : 0,
    purpose: recipientPdElementMapping.purpose,
    recipientBpaMappingId: recipientPdElementMapping?.recipient?.recipientBpaMappingId ?? 0,
    pdElementMappings: [],
    isDeleted: isDeleted,
  }
  recipient.pdElementMappings = recipientPdElementMapping.pdElementMappingList.map((pd: PdElementMapping) =>
    prepareRecepientPdMappingPayload(recipientPdElementMapping, pd, isDeleted)) || [];


  if (!isDeleted) {  //If isDeleted is false, you have to append deleted pd mapping
    const _deletedRecipientPdMappingList = deletedRecipientPdMappingList.filter(pdEle => pdEle.recipientBpaMappingId == recipientPdElementMapping.recipient.recipientBpaMappingId)
    recipient.pdElementMappings = recipient.pdElementMappings.concat(_deletedRecipientPdMappingList ?? [])
  }

  return recipient
}

export const prepareRecepientPdMappingPayload = (recipientMapping: RecipientPdElementMapping, PdElementMapping: PdElementMapping, isDeleted: boolean = false): RecipientPdMappingPayload => {
  const recipientPdMapping: RecipientPdMappingPayload = {
    dsId: (PdElementMapping.dataSubject?.id ?? 0),
    pdElementRecipientMappingId: PdElementMapping.pdElement?.pdBpaMappingId ?? 0,
    pdElementId: (PdElementMapping.pdElement?.id ?? 0),
    isDeleted: isDeleted,
    recipientBpaMappingId: (recipientMapping.recipient?.recipientBpaMappingId ?? 0)
  };
  return recipientPdMapping
}

export const prepareBpaPurposeMappingDataPayload = (purposeMapping: Purpose, isDeleted: boolean = false): PurposeMappingPayload => {
  const purpose: PurposeMappingPayload = {
    purposeId: (purposeMapping?.id ?? 0),
    bpaPurposeId: (purposeMapping.bpaPurposeMappingId ?? 0),
    isDeleted: isDeleted
  };
  return purpose
}

// Inside bpa-utils.ts
export const prepareRegionMappingDataPayload = (countryMapping: any, isDeleted: boolean = false): RegionMappingPayload => {
  return {
    dsRegionId: (countryMapping?.id ?? 0),
    // Ensure we take the mapping ID from the object if it exists
    dsRegionBpaMappingId: (countryMapping.dsRegionBpaMappingId ?? 0),
    isDeleted: isDeleted
  };
}
export const prepareDataSubjectMappingDataPayload = (dsMapping: BpaDataSubject, isDeleted: boolean = false): DataSubjectTypeMappingPayload => {
  const dataSubject: DataSubjectTypeMappingPayload = {
    dsId: (dsMapping?.id ?? 0),
    dsBpaMappingId: (dsMapping.dsBpaMappingId ?? 0),
    isDeleted: isDeleted
  };
  return dataSubject
}