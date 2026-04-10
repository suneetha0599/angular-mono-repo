export interface User {
  applicationUserId: number;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  active: boolean;
  userType: string;
  entities: string[];
  createdAt: string;
  permissions: string[];
  roles: string[];
  departments: any[];
  selected: boolean;
  profilePhoto: string
  invitationPending: boolean
}

export interface Permission {
  value: string;
  source: string;
}