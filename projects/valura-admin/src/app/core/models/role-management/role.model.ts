export interface Role {
  primitives: any;
  id: number;
  name: string;
  description: string;
  createdAt?: string;
}

export interface CreateRolePayload {
  name: string;
  description: string;
  primitives: string[];
}

export interface Permission {
  name: string;
  value: string;
  description: string;
  enabled: boolean;
  parentPrimitives: string[];
}

export interface PermissionModule {
  [key: string]: Permission[];
}

export interface Primitive {
  overrideSource?: string;
  overridden?: boolean;
  value: string;
  name: string;
  description: string;
  enabled: boolean;
  initiallyEnabled: boolean;
  source?: string;
  manualOverride?: 'ENABLE' | 'DISABLE' | null;
  parentPrimitives?: string[];
}

export interface PrimitiveGroup {
  [key: string]: Primitive[];
}

export interface PermissionOverride {
  primitive: string;
  type: 'ALLOW' | 'DENY';
}

export interface UpdateUserPermissionsPayload {
  overrides: PermissionOverride[];
}

