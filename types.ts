
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string; // ISO string YYYY-MM-DD
  category: string;
  cardId?: string;
  loanId?: string; // Link to a loan
  recurrenceId?: string; // Link to a group of recurring transactions
  isPaid: boolean;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string; // Hex code or Tailwind class mapping
  brandName: string;
  brandLogo?: string; // URL for the bank logo
}

export interface Loan {
  id: string;
  name: string;
  totalValue: number;
  startDate: string;
  endDate: string;
  monthlyPayment: number;
  paidInstallments: number;
  totalInstallments: number;
  imageUrl?: string;
  lastInstallmentValue?: number; // New field for specific interest calculation
}

export interface Investment {
  id: string;
  name: string;
  type: string; // e.g., CDB, Stocks, FIIs
  amountInvested: number;
  currentValue: number;
  date: string;
}

export interface AppData {
  transactions: Transaction[];
  cards: CreditCard[];
  loans: Loan[];
  investments: Investment[];
}
