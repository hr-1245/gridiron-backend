import { rolesEnum } from "src/types/enums/roles";

export interface userjwtInterface {
  id: number;
  email: string;
  role: rolesEnum
}

export interface adminJwtInterface {
  id: number;
  email: string
  role: rolesEnum
}
