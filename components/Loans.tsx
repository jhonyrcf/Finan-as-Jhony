import React from 'react';
import { Loan } from '../types';
import { Car, Home, Plus, Calendar, DollarSign, Pencil, Trash2, AlertCircle } from 'lucide-react';

interface LoansProps {
    loans: Loan[];
    onAddLoan: () => void;
    onEditLoan: (loan: Loan) => void;
    onDeleteLoan: (id: string) => void;
}

export const Loans: React.FC<LoansProps> = ({ loans, onAddLoan, onEditLoan, onDeleteLoan }) => {
    return (
        <div className="space-y-6 pb-20">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Meus Financiamentos</h2>
                <button onClick={onAddLoan} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors">
                    <Plus size={18} /> Novo Financiamento
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loans.map(loan => {
                    const remaining = loan.totalValue - (loan.monthlyPayment * loan.paidInstallments);
                    const progress = (loan.paidInstallments / loan.totalInstallments) * 100;
                    const isHouse = loan.name.toLowerCase().includes('casa') || loan.name.toLowerCase().includes('imóvel');
                    
                    return (
                        <div key={loan.id} className="relative bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg group">
                            
                            {/* Optional Image Cover */}
                            {loan.imageUrl && (
                                <div className="h-40 w-full relative">
                                    <img src={loan.imageUrl} alt={loan.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                                </div>
                            )}

                            <div className="p-6 relative">
                                {/* Edit/Delete Overlay (or top right) */}
                                <div className="absolute top-4 right-4 flex gap-2">
                                     <button 
                                        onClick={() => onEditLoan(loan)}
                                        className="p-2 rounded-lg bg-slate-900/80 hover:bg-cyan-500 text-white transition-colors"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button 
                                        onClick={() => onDeleteLoan(loan.id)}
                                        className="p-2 rounded-lg bg-slate-900/80 hover:bg-red-500 text-white transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${isHouse ? 'bg-blue-900/50 text-blue-400' : 'bg-orange-900/50 text-orange-400'}`}>
                                            {isHouse ? <Home size={24} /> : <Car size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{loan.name}</h3>
                                            <p className="text-sm text-slate-400">R$ {loan.monthlyPayment.toFixed(2)} / mês</p>
                                        </div>
                                    </div>
                                    {!loan.imageUrl && (
                                         <div className="text-right pr-12">
                                            <p className="text-xs text-slate-400">Valor Total</p>
                                            <p className="text-lg font-bold text-slate-200">R$ {loan.totalValue.toFixed(2)}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-6">
                                    <div className="flex justify-between text-xs mb-2">
                                        <span className="text-emerald-400">{progress.toFixed(0)}% Pago</span>
                                        <span className="text-slate-400">{loan.paidInstallments} de {loan.totalInstallments} parcelas</span>
                                    </div>
                                    <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t border-slate-700 pt-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                                            <DollarSign size={14} />
                                            <span className="text-xs">Valor Restante</span>
                                        </div>
                                        <p className="text-lg font-bold text-white">R$ {remaining.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                                            <Calendar size={14} />
                                            <span className="text-xs">Previsão Fim</span>
                                        </div>
                                        <p className="text-lg font-bold text-white">{new Date(loan.endDate).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>

                                {loan.lastInstallmentValue && (
                                    <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center gap-2">
                                        <AlertCircle size={14} className="text-indigo-400" />
                                        <p className="text-xs text-slate-300">
                                            Valor da Última Parcela: <span className="font-bold text-white">R$ {loan.lastInstallmentValue.toFixed(2)}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};