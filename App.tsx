
import React, { useState, useEffect, useMemo } from 'react';
import { getData, saveData, generateId } from './services/storage';
import { AppData, Transaction, CreditCard, Loan, Investment } from './types';
import { LayoutDashboard, CreditCard as CardIcon, Home, TrendingUp, List, Menu, X, PlusCircle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

// Components
import { Dashboard } from './components/Dashboard';
import { CreditCards } from './components/CreditCards';
import { Loans } from './components/Loans';
import { Investments } from './components/Investments';
import { TransactionList } from './components/TransactionList';
import { TransactionModal, CardModal, LoanModal, InvestmentModal } from './components/Modals';

const App: React.FC = () => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cards' | 'loans' | 'investments' | 'transactions'>('dashboard');
  const [data, setData] = useState<AppData>({ transactions: [], cards: [], loans: [], investments: [] });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Date State for Filtering
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modals & Editing State
  const [showTransModal, setShowTransModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  const [showLoanModal, setShowLoanModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);

  const [showInvestModal, setShowInvestModal] = useState(false);
  const [editingInvest, setEditingInvest] = useState<Investment | null>(null);


  // --- Effects ---
  useEffect(() => {
    const storedData = getData();
    setData(storedData);
  }, []);

  useEffect(() => {
    if (data.transactions.length > 0 || data.cards.length > 0 || data.loans.length > 0 || data.investments.length > 0) { 
         saveData(data);
    }
  }, [data]);

  // --- Filtering Logic ---
  const currentMonthTransactions = useMemo(() => {
    return data.transactions.filter(t => {
      const tDate = new Date(t.date + 'T00:00:00'); // Fix timezone issues by appending time
      return tDate.getMonth() === currentDate.getMonth() && 
             tDate.getFullYear() === currentDate.getFullYear();
    });
  }, [data.transactions, currentDate]);

  const changeMonth = (increment: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + increment);
      return newDate;
    });
  };
  
  // --- Global Metrics ---
  // Calculate overdue items across ALL time, not just the current month
  const globalOverdueCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return data.transactions.filter(t => t.type === 'expense' && !t.isPaid && t.date < today).length;
  }, [data.transactions]);

  // --- Handlers (Create/Update/Delete) ---
  
  // Transaction
  const handleSaveTransaction = (t: Transaction, recurring?: { months: number }) => {
    setData(prev => {
        let newTransactions = [...prev.transactions];

        if (recurring && recurring.months > 1) {
            // Generate Recurring Transactions
            const recurrenceId = generateId();
            const baseDate = new Date(t.date);
            
            for (let i = 0; i < recurring.months; i++) {
                const nextDate = new Date(baseDate);
                nextDate.setMonth(baseDate.getMonth() + i);
                
                newTransactions.push({
                    ...t,
                    id: i === 0 ? t.id : generateId(), // First one keeps ID, others get new
                    date: nextDate.toISOString().split('T')[0],
                    description: `${t.description} (${i + 1}/${recurring.months})`,
                    recurrenceId: recurrenceId,
                    isPaid: i === 0 ? t.isPaid : false // Future ones default to unpaid
                });
            }
        } else {
            // Single Transaction (Update or Create)
            const exists = prev.transactions.find(item => item.id === t.id);
            if (exists) {
                newTransactions = prev.transactions.map(item => item.id === t.id ? t : item);
            } else {
                newTransactions.push(t);
            }
        }
        return { ...prev, transactions: newTransactions };
    });
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
  const openEditTransaction = (t: Transaction) => { setEditingTransaction(t); setShowTransModal(true); };

  // Card
  const handleSaveCard = (c: CreditCard) => {
      setData(prev => {
          const exists = prev.cards.find(item => item.id === c.id);
          if(exists) {
              return { ...prev, cards: prev.cards.map(item => item.id === c.id ? c : item) };
          }
          return { ...prev, cards: [...prev.cards, c] };
      });
      setEditingCard(null);
  }
  const handleDeleteCard = (id: string) => setData(prev => ({ ...prev, cards: prev.cards.filter(c => c.id !== id) }));
  const openEditCard = (c: CreditCard) => { setEditingCard(c); setShowCardModal(true); };

  // Loan
  const handleSaveLoan = (l: Loan) => {
      setData(prev => {
          let updatedTransactions = [...prev.transactions];
          let updatedLoans = [...prev.loans];
          
          const exists = prev.loans.find(item => item.id === l.id);

          if(exists) {
              updatedLoans = prev.loans.map(item => item.id === l.id ? l : item);
              // Note: Editing a loan does not currently rewrite all transactions to avoid destroying payment history.
              // In a full app, you might ask the user if they want to update future installments.
          } else {
              // Create New Loan
              updatedLoans.push(l);

              // AUTOMATICALLY GENERATE INSTALLMENT TRANSACTIONS
              const startDate = new Date(l.startDate + 'T00:00:00');
              
              for (let i = 0; i < l.totalInstallments; i++) {
                  const installmentDate = new Date(startDate);
                  installmentDate.setMonth(startDate.getMonth() + i);
                  
                  // Use lastInstallmentValue for the final one if specified
                  const amount = (i === l.totalInstallments - 1 && l.lastInstallmentValue) 
                      ? l.lastInstallmentValue 
                      : l.monthlyPayment;

                  updatedTransactions.push({
                      id: generateId(),
                      description: `${l.name} (${i + 1}/${l.totalInstallments})`,
                      amount: amount,
                      type: 'expense',
                      date: installmentDate.toISOString().split('T')[0],
                      category: 'Financiamento',
                      isPaid: i < l.paidInstallments, // Mark strictly past ones as paid if configured
                      loanId: l.id
                  });
              }
          }
          return { ...prev, loans: updatedLoans, transactions: updatedTransactions };
      });
      setEditingLoan(null);
  }

  const handleDeleteLoan = (id: string) => {
      // Deleting a loan also deletes its future/unpaid transactions? 
      // For safety, let's keep transactions but remove the loan reference, or delete both.
      // Here we delete both to keep it clean.
      if(window.confirm("Deseja excluir também os lançamentos vinculados a este financiamento?")) {
        setData(prev => ({ 
            ...prev, 
            loans: prev.loans.filter(l => l.id !== id),
            transactions: prev.transactions.filter(t => t.loanId !== id)
        }));
      } else {
        setData(prev => ({ ...prev, loans: prev.loans.filter(l => l.id !== id) }));
      }
  };
  const openEditLoan = (l: Loan) => { setEditingLoan(l); setShowLoanModal(true); };

  // Investment
  const handleSaveInvestment = (i: Investment) => {
      setData(prev => {
          const exists = prev.investments.find(item => item.id === i.id);
          if(exists) {
              return { ...prev, investments: prev.investments.map(item => item.id === i.id ? i : item) };
          }
          return { ...prev, investments: [...prev.investments, i] };
      });
      setEditingInvest(null);
  }
  const handleDeleteInvestment = (id: string) => setData(prev => ({ ...prev, investments: prev.investments.filter(inv => inv.id !== id) }));
  const openEditInvestment = (i: Investment) => { setEditingInvest(i); setShowInvestModal(true); };


  // --- Navigation Config ---
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cards', label: 'Cartões', icon: CardIcon },
    { id: 'loans', label: 'Financiamentos', icon: Home },
    { id: 'investments', label: 'Investimentos', icon: TrendingUp },
    { id: 'transactions', label: 'Extrato', icon: List },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      
      {/* Top Bar (Mobile) */}
      <div className="md:hidden flex justify-between items-center p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="font-bold text-xl tracking-tighter text-white">NEON<span className="text-cyan-400">FINANCE</span></div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
            {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <div className="flex">
        
        {/* Sidebar Navigation */}
        <aside className={`
            fixed md:sticky top-0 left-0 z-20 h-screen w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            flex flex-col
        `}>
            <div className="p-6 hidden md:block">
                <h1 className="font-bold text-2xl tracking-tighter text-white">NEON<span className="text-cyan-400">FINANCE</span></h1>
            </div>
            
            <nav className="mt-4 px-4 space-y-2 flex-1">
                {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                                ${isActive ? 'bg-cyan-500/10 text-cyan-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                            `}
                        >
                            <Icon size={20} />
                            {item.label}
                            {item.id === 'dashboard' && globalOverdueCount > 0 && (
                                <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button 
                    onClick={() => { setEditingTransaction(null); setShowTransModal(true); }}
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white py-3 rounded-xl transition-colors"
                >
                    <PlusCircle size={18} /> Lançamento Rápido
                </button>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full overflow-hidden flex flex-col h-screen">
            
            {/* Global Month Filter Bar */}
            <div className="bg-slate-900/50 backdrop-blur border-b border-slate-800 p-4 flex justify-between items-center z-10 sticky top-0 md:static">
                <div className="flex items-center gap-4 bg-slate-800 rounded-full px-2 py-1 border border-slate-700">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-700 rounded-full text-cyan-400 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2 text-white font-bold min-w-[140px] justify-center">
                        <Calendar size={16} className="text-slate-400" />
                        <span className="capitalize">
                            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-700 rounded-full text-cyan-400 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
                
                {/* Contextual Title based on Tab */}
                <h2 className="hidden md:block text-slate-400 text-sm font-medium uppercase tracking-widest">
                    {activeTab === 'dashboard' ? 'Visão Geral' : 
                     activeTab === 'cards' ? 'Gerenciamento de Cartões' : 
                     activeTab === 'loans' ? 'Meus Contratos' :
                     activeTab === 'investments' ? 'Carteira de Ativos' : 'Histórico'}
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                {activeTab === 'dashboard' && (
                    <Dashboard 
                        transactions={currentMonthTransactions} 
                        onAddClick={() => { setEditingTransaction(null); setShowTransModal(true); }}
                        currentDate={currentDate}
                        totalOverdueCount={globalOverdueCount}
                    />
                )}
                
                {activeTab === 'cards' && (
                    <CreditCards 
                        cards={data.cards} 
                        // Cards need FULL transaction history to calculate balances, 
                        // but logic inside Component handles invoice dates.
                        transactions={data.transactions} 
                        onAddCard={() => { setEditingCard(null); setShowCardModal(true); }}
                        onEditCard={openEditCard}
                        onDeleteCard={handleDeleteCard}
                    />
                )}
                
                {activeTab === 'loans' && (
                    <Loans 
                        loans={data.loans} 
                        onAddLoan={() => { setEditingLoan(null); setShowLoanModal(true); }} 
                        onEditLoan={openEditLoan}
                        onDeleteLoan={handleDeleteLoan}
                    />
                )}
                
                {activeTab === 'investments' && (
                    <Investments 
                        investments={data.investments} 
                        onAddInvestment={() => { setEditingInvest(null); setShowInvestModal(true); }}
                        onEditInvestment={openEditInvestment}
                        onDeleteInvestment={handleDeleteInvestment}
                    />
                )}
                
                {activeTab === 'transactions' && (
                    <TransactionList 
                        transactions={currentMonthTransactions} 
                        onEditTransaction={openEditTransaction}
                        onDeleteTransaction={handleDeleteTransaction}
                    />
                )}
            </div>
        </main>

      </div>

      {/* Modals */}
      <TransactionModal 
        isOpen={showTransModal} 
        onClose={() => setShowTransModal(false)} 
        onSave={handleSaveTransaction}
        cards={data.cards}
        initialData={editingTransaction}
      />
      <CardModal 
        isOpen={showCardModal} 
        onClose={() => setShowCardModal(false)} 
        onSave={handleSaveCard}
        initialData={editingCard}
      />
      <LoanModal 
        isOpen={showLoanModal} 
        onClose={() => setShowLoanModal(false)} 
        onSave={handleSaveLoan}
        initialData={editingLoan}
      />
      <InvestmentModal 
        isOpen={showInvestModal} 
        onClose={() => setShowInvestModal(false)} 
        onSave={handleSaveInvestment}
        initialData={editingInvest}
      />

    </div>
  );
};

export default App;
