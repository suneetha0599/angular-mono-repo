export interface UserDetails {
  id: number;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  departments: Department[];
  roles: string[];
  active: boolean;
  createdAt: string;
}
export interface Department {
  id: number;
  name: string;
  description: string;
  selected?: boolean;
}

export interface Permission {
  value: string;
  source: string;
}
export interface User {
  primitiveOverrides: any;
  applicationUserId: number;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  phone: string;
  active: boolean;
  userType: string;
  entities: string[];
  createdAt: string;
  permissions?: Permission[];
  roles: Role[];
  departments: [];
  selected: boolean;
  profilePhoto: string
}

export interface UserSearchParams {
  userType?: string[];
}

export interface CreateUserAssignmentPayload {
  roleIds: number[];
  departmentId: number;
  applicationUserIds: number[];
}

export interface CreateUserPayload {
  email: string;
  displayName: string;
  phone: string;
  roles: number[];
  sendInvite: boolean;
  departments: number[];
  firstName: string;
  lastName: string;
  newDepartmentList: Department[]
}

export interface Role {
  id: number;
  name: string;
  description: string;
  type: string;
  entityId: string;
  primitives: string[];
}
