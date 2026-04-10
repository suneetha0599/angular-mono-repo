export interface Department {
  id: number;
  name: string;
  description: string;
}

export interface CreateDepartmentPayload {
  name: string;
  description: string;
}
