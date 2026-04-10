export interface Assessment {
  id: number;
  name: string;
  bpaName: string;
  status: string;
  createdOn: string;
  trigger: string;
  owner: string;
  dueDate: string;
  actions?: string;
  state: string
}


export interface AssessmentType {
  id: number;
  name: string;
}

export interface AssessmentBpaDetails {
  asset: any;
  bpa: {
    bpaId: number,
    name: string,
  },
  vendor?: {
    vendorId: number,
    name: string,
  },
  regulation: any,
  processOwner: UserType
  disabled: boolean
}

export interface UserType {
  userType: '',
  userId: 0,
  displayName: '',
  email: ''
}
