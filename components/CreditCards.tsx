import React from 'react';
import { CreditCard, Transaction } from '../types';
import { CreditCard as CardIcon, Plus, AlertCircle, Trash2, Pencil } from 'lucide-react';

interface CreditCardsProps {
  cards: CreditCard[];
  transactions: Transaction[];
  onAddCard: () => void;
  onEditCard: (card: CreditCard) => void;
  onDeleteCard: (id: string) => void;
}

export const CreditCards: React.FC<CreditCardsProps> = ({ cards, transactions, onAddCard, onEditCard, onDeleteCard }) => {
  
  const getCardMetrics = (card: CreditCard) => {
    const today = new Date();
    
    // Determine the current open invoice closing date
    // If today is before the closing day, the invoice closes this month.
    // If today is on or after the closing day, the invoice closes next month.
    let invoiceDate = new Date(today.getFullYear(), today.getMonth(), card.closingDay);
    if (today.getDate() >= card.closingDay) {
        invoiceDate.setMonth(invoiceDate.getMonth() + 1);
    }
    
    // Invoice Period Start: The day after the previous closing date
    const previousClosingDate = new Date(invoiceDate);
    previousClosingDate.setMonth(previousClosingDate.getMonth() - 1);
    
    // Filter transactions for "Current Invoice" display
    // Logic: Transaction date must be > previous closing date AND <= current invoice closing date
    const currentInvoiceTransactions = transactions.filter(t => {
        if (t.cardId !== card.id || t.type !== 'expense') return false;
        const tDate = new Date(t.date);
        return tDate > previousClosingDate && tDate <= invoiceDate;
    });
    
    const currentInvoice = currentInvoiceTransactions.reduce((acc, t) => acc + t.amount, 0);
    
    // Available Limit: Card Limit - All Unpaid Expenses linked to this card
    // We use "Unpaid" here to track total debt, including future installments or overdue bills
    const allUnpaidCardExpenses = transactions
        .filter(t => t.cardId === card.id && t.type === 'expense' && !t.isPaid)
        .reduce((acc, t) => acc + t.amount, 0);

    const availableLimit = card.limit - allUnpaidCardExpenses;
    
    // Determine Due Date (Vencimento)
    const dueDate = new Date(invoiceDate.getFullYear(), invoiceDate.getMonth(), card.dueDay);
    
    return { currentInvoice, availableLimit, nextDueDate: dueDate };
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Meus Cartões</h2>
        <button onClick={onAddCard} className="flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-lg transition-colors">
            <Plus size={18} /> Novo Cartão
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cards.map(card => {
          const { currentInvoice, availableLimit, nextDueDate } = getCardMetrics(card);
          
          return (
            <div key={card.id} className="relative bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl overflow-hidden group hover:border-slate-600 transition-all">
               {/* Brand Color Strip */}
              <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: card.color }}></div>
              
              <div className="pl-4">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        {card.brandLogo ? (
                            <div className="w-12 h-12 rounded-lg bg-white p-1 flex items-center justify-center overflow-hidden">
                                <img src={card.brandLogo} alt={card.name} className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="p-2 rounded-lg bg-slate-900/50">
                                 <CardIcon size={24} style={{ color: card.color }} />
                            </div>
                        )}
                        <div>
                            <h3 className="font-bold text-lg text-white">{card.name}</h3>
                            <p className="text-xs text-slate-400 uppercase tracking-wider">**** **** **** 1234</p>
                        </div>
                    </div>
                     {/* Actions */}
                    <div className="flex items-center gap-2">
                         <button 
                            onClick={(e) => { e.stopPropagation(); onEditCard(card); }}
                            className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                            <Pencil size={16} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteCard(card.id); }}
                            className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-slate-400 text-xs mb-1">Fatura Atual</p>
                        <p className="text-2xl font-bold text-white">R$ {currentInvoice.toFixed(2)}</p>
                    </div>

                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                            className="h-full transition-all duration-500"
                            style={{ 
                                width: `${Math.min((currentInvoice / card.limit) * 100, 100)}%`,
                                backgroundColor: card.color 
                            }}
                        ></div>
                    </div>

                    <div className="flex justify-between text-sm">
                        <div>
                            <p className="text-slate-400 text-xs">Limite Disponível</p>
                            <p className="text-emerald-400 font-medium">R$ {Math.max(availableLimit, 0).toFixed(2)}</p>
                        </div>
                         <div className="text-right">
                            <p className="text-slate-400 text-xs">Limite Total</p>
                            <p className="text-slate-200 font-medium">R$ {card.limit.toFixed(2)}</p>
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
                        <div className="text-xs text-slate-400">
                            Vence em: <span className="text-white font-bold">{nextDueDate.toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="text-xs text-slate-400">
                            Fecha dia: <span className="text-white font-bold">{card.closingDay}</span>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {cards.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-500">
                <AlertCircle size={48} className="mb-4 opacity-50" />
                <p>Nenhum cartão cadastrado.</p>
            </div>
        )}
      </div>
    </div>
  );
};