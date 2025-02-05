export interface House {
  id?: string;
  name: string;
  address: string;
  rules?: string;
  createdBy: string;
  createdAt: Date;
}

export interface HouseMember {
  id?: string;
  houseId: string;
  userId: string;
  email: string;
  isAdmin: boolean;
  joinedAt: Date;
}