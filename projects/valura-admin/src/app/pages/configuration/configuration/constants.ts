export enum ConfigKey {
  FORM_ELEMENT = 'FORM_ELEMENT',
  DISPLY_SETTING = 'DISPLY_SETTING',
  DISPLY_TEXT = 'DISPLY_TEXT'
}

export const CONFIG_STAGES = [
  { position: 0, name: "Form Elements", key: ConfigKey.FORM_ELEMENT },
  { position: 1, name: "Display Setting", key: ConfigKey.DISPLY_SETTING },
  { position: 2, name: "Privacy Centre Setting", key: ConfigKey.DISPLY_TEXT },
];


export enum FormElementsConfig {
  REQUESTER_INFO = 'REQUESTER_INFO',
  THIRD_PARTY_ROLE = 'THIRD_PARTY_ROLE',
  REGULATIONS = 'REGULATIONS',
  RIGHTS = 'RIGHTS',
  DATA_SUBJECT_ROLE = 'DATA_SUBJECT_ROLE',
  DECLARATION = 'DECLARATION',
  CHANNEL = 'CHANNEL'
}

//Keerthi's change
export const RequesterInfoTableColumn = [
  { columnDef: 'label', headerName: 'Label', sortable: true, width: '15%' },
  { columnDef: 'overridden', headerName: 'Description', sortable: true, width: '75%' },
  { columnDef: 'action', headerName: 'Action', sortable: true, width: '10%' },
];

export const ThirdPartyRoleTableColumn = [
  { columnDef: 'name', headerName: 'Label', sortable: true, width: '25%' },
  { columnDef: 'description', headerName: 'Description', sortable: true, width: '65%' },
  { columnDef: 'action', headerName: 'Actions', sortable: true, width: '10%' }
];

export const ChannelTableColumn = [
  { columnDef: 'label', headerName: 'Label', sortable: true, width: '90%' },
  { columnDef: 'action', headerName: 'Actions', sortable: true, width: '10%' }
];


export const RegulationTableHeaders = [
  { columnDef: 'name', headerName: 'Regulation', sortable: true, width: '40%' },
  { columnDef: 'jurisdiction', headerName: 'Jurisdiction', sortable: true, width: '20%' },
  { columnDef: 'countryNames', headerName: 'Applicable Countries', sortable: true, width: '30%' },
  { columnDef: 'action', headerName: 'Actions', sortable: true, width: '10%' },
];

export const RightsTableHeaders = [
   { columnDef: 'provision', headerName: 'Provision', sortable: true, width: '15%' },
  { columnDef: 'rightTitleSimplified', headerName: 'Right Title', sortable: true, width: '20%' },
  { columnDef: 'rightDescriptionSimplified', headerName: 'Right Description', sortable: true, width: '40%' },
  { columnDef: 'iconName', headerName: 'Icon', sortable: true, width: '25%' },
  { columnDef: 'action', headerName: 'Actions', sortable: true, width: '10%' },
];

export const RoleDisplayedColumns = [
  { columnDef: 'name', headerName: 'Label', sortable: true, width: '20%' },
  { columnDef: 'description', headerName: 'Description', sortable: true, width: '68%' },
  { columnDef: 'action', headerName: 'Actions', sortable: true, width: '12%' },
];

export const DeclarationInfoTableHeaders = [
  { columnDef: 'rightTitle', headerName: 'Right Name', sortable: true, width: '25%' },
  { columnDef: 'declaration', headerName: 'Declaration', sortable: true, width: '63%' },
  { columnDef: 'action', headerName: 'Actions', sortable: true, width: '12%' },
]

export const GeneralDeclarationInfoTableHeaders = [
  { columnDef: 'declaration', headerName: 'Declaration', sortable: true, width: '88%' },
  { columnDef: 'action', headerName: 'Actions', sortable: true, width: '12%' },
]

export enum EntityType {
  REGULATION = "REGULATION",
  RIGHT = "RIGHT"
}

export enum EntityTypeSpecific {
  REGULATION_SPECIFIC = "REGULATION_SPECIFIC",
  RIGHT_SPECIFIC = "RIGHT_SPECIFIC"
}

