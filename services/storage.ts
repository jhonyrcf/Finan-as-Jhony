import { AppData, Transaction, CreditCard, Loan, Investment } from '../types';

const STORAGE_KEY = 'neon_finance_data_v1';

const initialData: AppData = {
  transactions: [
    { id: '1', description: 'Salário', amount: 5000, type: 'income', date: new Date().toISOString().split('T')[0], category: 'Salário', isPaid: true },
    { id: '2', description: 'Aluguel', amount: 1200, type: 'expense', date: new Date().toISOString().split('T')[0], category: 'Moradia', isPaid: true },
    { id: '3', description: 'Supermercado', amount: 450, type: 'expense', date: '2023-10-20', category: 'Alimentação', isPaid: false },
  ],
  cards: [
    { 
      id: '1', 
      name: 'Nubank', 
      limit: 8000, 
      closingDay: 5, 
      dueDay: 12, 
      color: '#820AD1', 
      brandName: 'Nubank',
      brandLogo: 'https://logo.clearbit.com/nubank.com.br'
    },
    { 
      id: '2', 
      name: 'Inter', 
      limit: 4500, 
      closingDay: 10, 
      dueDay: 17, 
      color: '#FF7A00', 
      brandName: 'Inter',
      brandLogo: 'https://logo.clearbit.com/bancointer.com.br'
    },
  ],
  loans: [
    { 
      id: '1', 
      name: 'Financiamento Carro', 
      totalValue: 45000, 
      startDate: '2023-01-15', 
      endDate: '2026-01-15', 
      monthlyPayment: 1250, 
      paidInstallments: 10, 
      totalInstallments: 36,
      imageUrl: 'https://img.freepik.com/fotos-gratis/carro-branco-isolado-em-um-fundo-branco_191095-231.jpg?t=st=1710100000~exp=1710103600~hmac=a1b2c3d4',
      lastInstallmentValue: 1250
    },
  ],
  investments: [
    { id: '1', name: 'Tesouro Direto', type: 'Renda Fixa', amountInvested: 10000, currentValue: 10500, date: '2023-05-01' },
  ],
};

export const getData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    saveData(initialData);
    return initialData;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse storage", e);
    return initialData;
  }
};

export const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const generateId = () => Math.random().toString(36).substr(2, 9);