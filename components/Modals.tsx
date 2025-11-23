
import React, { useState, useEffect } from 'react';
import { Transaction, CreditCard, Loan, Investment } from '../types';
import { generateId } from '../services/storage';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const BaseModal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Transaction Modal ---

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (t: Transaction, recurring?: { months: number }) => void;
  cards: CreditCard[];
  initialData?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSave, cards, initialData }) => {
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    isPaid: true,
  });

  // Recurring state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceMonths, setRecurrenceMonths] = useState(2);

  useEffect(() => {
    if (isOpen) {
        setIsRecurring(false);
        setRecurrenceMonths(2);
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                type: 'expense',
                date: new Date().toISOString().split('T')[0],
                isPaid: true,
                description: '',
                amount: 0,
                category: '',
                cardId: ''
            });
        }
    }
  }, [isOpen, initialData]);

  const handleCardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const cardId = e.target.value;
      setFormData(prev => ({
          ...prev,
          cardId: cardId || undefined,
          // If a card is selected, default to NOT PAID (pending invoice), unless manually changed later
          isPaid: cardId ? false : prev.isPaid 
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    onSave({
      id: initialData?.id || generateId(),
      description: formData.description,
      amount: Number(formData.amount),
      type: formData.type as 'income' | 'expense',
      date: formData.date || new Date().toISOString().split('T')[0],
      category: formData.category || 'Geral',
      isPaid: formData.isPaid || false,
      cardId: formData.cardId,
      recurrenceId: initialData?.recurrenceId // Keep existing recurrence ID if editing
    }, isRecurring ? { months: recurrenceMonths } : undefined);
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Transação" : "Nova Transação"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Tipo</label>
            <select
              className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-cyan-500 outline-none"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
            >
              <option value="income">Entrada</option>
              <option value="expense">Saída</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Valor</label>
            <input
              type="number"
              step="0.01"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-cyan-500 outline-none"
              value={formData.amount || ''}
              onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Descrição</label>
          <input
            type="text"
            className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-cyan-500 outline-none"
            value={formData.description || ''}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Categoria</label>
            <input
              type="text"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-cyan-500 outline-none"
              value={formData.category || ''}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Data</label>
            <input
              type="date"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-cyan-500 outline-none"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
        </div>
        
        {formData.type === 'expense' && (
          <div>
             <label className="block text-sm text-slate-400 mb-1">Vincular Cartão (Opcional)</label>
             <select
                className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-cyan-500 outline-none"
                value={formData.cardId || ''}
                onChange={handleCardChange}
             >
                <option value="">Nenhum (Débito/Dinheiro)</option>
                {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
             {formData.cardId && (
                 <p className="text-xs text-yellow-500 mt-1">Transações no cartão geram fatura pendente.</p>
             )}
          </div>
        )}

        {/* Recurring Option (Only for new transactions) */}
        {!initialData && (
             <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                    <input
                        type="checkbox"
                        id="isRecurring"
                        className="w-4 h-4 bg-slate-800 border-slate-600 rounded accent-cyan-500"
                        checked={isRecurring}
                        onChange={e => setIsRecurring(e.target.checked)}
                    />
                    <label htmlFor="isRecurring" className="text-slate-300 text-sm">Conta Fixa / Parcelada</label>
                </div>
                {isRecurring && (
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Repetir por quantos meses?</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="range" 
                                min="2" 
                                max="24" 
                                value={recurrenceMonths}
                                onChange={e => setRecurrenceMonths(Number(e.target.value))}
                                className="w-full accent-cyan-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-white font-bold w-8 text-center">{recurrenceMonths}x</span>
                        </div>
                    </div>
                )}
            </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPaid"
            className="w-4 h-4 bg-slate-800 border-slate-600 rounded accent-cyan-500"
            checked={formData.isPaid}
            onChange={e => setFormData({ ...formData, isPaid: e.target.checked })}
          />
          <label htmlFor="isPaid" className="text-slate-300">Já efetuado/pago?</label>
        </div>

        <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-3 rounded transition-colors">
          {initialData ? 'Atualizar Transação' : 'Salvar Transação'}
        </button>
      </form>
    </BaseModal>
  );
};

// --- Card Modal ---

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (c: CreditCard) => void;
  initialData?: CreditCard | null;
}

const BANK_PRESETS = [
    { name: 'Nubank', color: '#820AD1', logo: 'https://logo.clearbit.com/nubank.com.br' },
    { name: 'Mercado Pago', color: '#009EE3', logo: 'https://logo.clearbit.com/mercadopago.com.br' },
    { name: 'Itaú', color: '#EC7000', logo: 'https://logo.clearbit.com/itau.com.br' },
    { name: 'Santander', color: '#EC0000', logo: 'https://logo.clearbit.com/santander.com.br' },
    { name: 'Bradesco', color: '#CC092F', logo: 'https://logo.clearbit.com/bradesco.com.br' },
    { name: 'Neon', color: '#00C1AF', logo: 'https://logo.clearbit.com/neon.com.br' },
    { name: 'PicPay', color: '#11C76F', logo: 'https://logo.clearbit.com/picpay.com' },
    { name: 'Inter', color: '#FF7A00', logo: 'https://logo.clearbit.com/bancointer.com.br' },
    { name: 'Havan', color: '#00458C', logo: 'https://logo.clearbit.com/havan.com.br' },
    { name: 'Casa China', color: '#E30613', logo: 'https://logo.clearbit.com/casachina.com.br' },
];

export const CardModal: React.FC<CardModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [data, setData] = useState<Partial<CreditCard>>({ color: '#820AD1' });

  useEffect(() => {
    if(isOpen) {
        if(initialData) {
            setData(initialData);
        } else {
            setData({ color: '#820AD1', name: '', limit: 0, closingDay: 1, dueDay: 10 });
        }
    }
  }, [isOpen, initialData]);

  const handleBankSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selected = BANK_PRESETS.find(b => b.name === e.target.value);
      if (selected) {
          setData(prev => ({
              ...prev,
              name: selected.name,
              color: selected.color,
              brandLogo: selected.logo,
              brandName: selected.name
          }));
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name || !data.limit) return;
    onSave({
      id: initialData?.id || generateId(),
      name: data.name,
      limit: Number(data.limit),
      closingDay: Number(data.closingDay || 1),
      dueDay: Number(data.dueDay || 10),
      color: data.color || '#333',
      brandName: data.brandName || data.name,
      brandLogo: data.brandLogo,
    });
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Cartão" : "Novo Cartão"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className="block text-sm text-slate-400 mb-1">Selecionar Banco</label>
            <select 
                onChange={handleBankSelect}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-fuchsia-500 outline-none mb-2"
                defaultValue=""
            >
                <option value="" disabled>Selecione um banco...</option>
                {BANK_PRESETS.map(bank => (
                    <option key={bank.name} value={bank.name}>{bank.name}</option>
                ))}
            </select>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Apelido do Cartão</label>
          <input type="text" className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-fuchsia-500 outline-none" value={data.name || ''} onChange={e => setData({...data, name: e.target.value})} required />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Limite</label>
          <input type="number" className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-fuchsia-500 outline-none" value={data.limit || ''} onChange={e => setData({...data, limit: Number(e.target.value)})} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="block text-sm text-slate-400 mb-1">Dia Fechamento</label>
             <input type="number" min="1" max="31" className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-fuchsia-500 outline-none" value={data.closingDay || ''} onChange={e => setData({...data, closingDay: Number(e.target.value)})} required />
          </div>
          <div>
             <label className="block text-sm text-slate-400 mb-1">Dia Vencimento</label>
             <input type="number" min="1" max="31" className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-fuchsia-500 outline-none" value={data.dueDay || ''} onChange={e => setData({...data, dueDay: Number(e.target.value)})} required />
          </div>
        </div>
        
        <div>
            <label className="block text-sm text-slate-400 mb-1">URL do Logo (Opcional)</label>
            <input type="text" className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-fuchsia-500 outline-none" value={data.brandLogo || ''} onChange={e => setData({...data, brandLogo: e.target.value})} />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Cor do Banco</label>
          <div className="flex gap-2 mt-2 flex-wrap">
            {['#820AD1', '#009EE3', '#EC7000', '#EC0000', '#CC092F', '#00C1AF', '#11C76F', '#FF7A00', '#00458C', '#E30613', '#333333'].map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setData({ ...data, color: c })}
                className={`w-8 h-8 rounded-full border-2 ${data.color === c ? 'border-white scale-110' : 'border-transparent'} transition-transform`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <button type="submit" className="w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-bold py-3 rounded transition-colors">
          {initialData ? 'Atualizar Cartão' : 'Salvar Cartão'}
        </button>
      </form>
    </BaseModal>
  );
};

// --- Loan Modal ---

interface LoanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (l: Loan) => void;
    initialData?: Loan | null;
}

export const LoanModal: React.FC<LoanModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [data, setData] = useState<Partial<Loan>>({});

    useEffect(() => {
        if (isOpen) {
            if(initialData) {
                setData(initialData);
            } else {
                setData({});
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!data.name || !data.totalValue) return;
        onSave({
            id: initialData?.id || generateId(),
            name: data.name,
            totalValue: Number(data.totalValue),
            startDate: data.startDate || new Date().toISOString().split('T')[0],
            endDate: data.endDate || '',
            monthlyPayment: Number(data.monthlyPayment || 0),
            paidInstallments: Number(data.paidInstallments || 0),
            totalInstallments: Number(data.totalInstallments || 1),
            imageUrl: data.imageUrl,
            lastInstallmentValue: data.lastInstallmentValue ? Number(data.lastInstallmentValue) : undefined,
        });
        onClose();
    }

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Financiamento" : "Novo Financiamento"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Descrição</label>
                    <input type="text" className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-emerald-500 outline-none" value={data.name || ''} onChange={e => setData({...data, name: e.target.value})} required />
                </div>
                <div>
                    <label className="block text-sm text-slate-400 mb-1">URL da Imagem (Opcional)</label>
                    <input type="url" placeholder="https://..." className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-emerald-500 outline-none" value={data.imageUrl || ''} onChange={e => setData({...data, imageUrl: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Valor Total</label>
                        <input type="number" className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-emerald-500 outline-none" value={data.totalValue || ''} onChange={e => setData({...data, totalValue: Number(e.target.value)})} required />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Parcela Mensal</label>
                        <input type="number" className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-emerald-500 outline-none" value={data.monthlyPayment || ''} onChange={e => setData({...data, monthlyPayment: Number(e.target.value)})} required />
                    </div>
                </div>
                
                {/* Last Installment Field */}
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Valor da Última Parcela</label>
                    <input type="number" className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-emerald-500 outline-none" value={data.lastInstallmentValue || ''} onChange={e => setData({...data, lastInstallmentValue: Number(e.target.value)})} placeholder="Opcional - Para identificar juros" />
                    <p className="text-xs text-slate-500 mt-1">Útil para identificar amortizações ou juros específicos.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Início</label>
                        <input type="date" className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-emerald-500 outline-none" value={data.startDate || ''} onChange={e => setData({...data, startDate: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Fim (Previsto)</label>
                        <input type="date" className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-emerald-500 outline-none" value={data.endDate || ''} onChange={e => setData({...data, endDate: e.target.value})} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Total Parcelas</label>
                        <input type="number" className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-emerald-500 outline-none" value={data.totalInstallments || ''} onChange={e => setData({...data, totalInstallments: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Pagas</label>
                        <input type="number" className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-emerald-500 outline-none" value={data.paidInstallments || ''} onChange={e => setData({...data, paidInstallments: Number(e.target.value)})} />
                    </div>
                </div>
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 rounded transition-colors">
                    {initialData ? 'Atualizar Financiamento' : 'Salvar Financiamento'}
                </button>
            </form>
        </BaseModal>
    );
}

// --- Investment Modal ---

interface InvestmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (i: Investment) => void;
    initialData?: Investment | null;
}

export const InvestmentModal: React.FC<InvestmentModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [data, setData] = useState<Partial<Investment>>({});

    useEffect(() => {
        if(isOpen) {
            if(initialData) {
                setData(initialData);
            } else {
                setData({});
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!data.name || !data.amountInvested) return;
        onSave({
            id: initialData?.id || generateId(),
            name: data.name,
            type: data.type || 'Outros',
            amountInvested: Number(data.amountInvested),
            currentValue: Number(data.currentValue || data.amountInvested),
            date: data.date || new Date().toISOString().split('T')[0],
        });
        onClose();
    }

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Investimento" : "Novo Investimento"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm text-slate-400 mb-1">Nome do Ativo</label>
                    <input type="text" className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-blue-500 outline-none" value={data.name || ''} onChange={e => setData({...data, name: e.target.value})} required />
                </div>
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Tipo (CDB, Ações, FIIs...)</label>
                    <input type="text" className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-blue-500 outline-none" value={data.type || ''} onChange={e => setData({...data, type: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Valor Investido</label>
                        <input type="number" step="0.01" className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-blue-500 outline-none" value={data.amountInvested || ''} onChange={e => setData({...data, amountInvested: Number(e.target.value)})} required />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Valor Atual</label>
                        <input type="number" step="0.01" className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-blue-500 outline-none" value={data.currentValue || ''} onChange={e => setData({...data, currentValue: Number(e.target.value)})} required />
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Data da Aplicação</label>
                    <input type="date" className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 focus:border-blue-500 outline-none" value={data.date || ''} onChange={e => setData({...data, date: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded transition-colors">
                    {initialData ? 'Atualizar Investimento' : 'Salvar Investimento'}
                </button>
            </form>
        </BaseModal>
    );
}
