export interface Expense {
    id?: string;
    houseId: string;
    title: string;
    amount: number;
    paidBy: string;
    paidByEmail: string;
    splitBetween: string[];
    category: string;
    date: Date;
    description: string;
    receiptUrl: string | null;
    settled: boolean;
    payments: Payment[];
    createdAt: Date;
  }
  
  export interface Payment {
    userId: string;
    userEmail: string;
    amount: number;
    paid: boolean;
    receiptUrl?: string | null;
    paidAt?: Date | null;
  }
  
  export interface Settlement {
    id?: string;
    fromUser: string;
    toUser: string;
    toUserEmail: string;
    amount: number;
    expenseId: string;
    settled: boolean;
    settledAt?: Date;
    pixKey?: string;
    houseId: string;
  }