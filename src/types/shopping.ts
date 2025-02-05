export interface ShoppingItem {
    id?: string;
    houseId: string;
    name: string;
    quantity: number;
    unit: string;
    urgent: boolean;
    estimatedPrice: number;
    addedBy: string;
    addedByEmail: string;
    completed: boolean;
    completedBy?: string;
    completedAt?: Date;
    createdAt: Date;
    expenseId?: string;
  }
  
  export interface ShoppingItemFormData {
    name: string;
    quantity: string;
    unit: string;
    urgent: boolean;
    estimatedPrice: string;
  }