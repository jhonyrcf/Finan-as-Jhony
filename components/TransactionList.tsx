
import React, { useState } from 'react';
import { Transaction } from '../types';
import { ArrowUpCircle, ArrowDownCircle, Search, AlertCircle, Pencil, Trash2, Repeat } from 'lucide-react';

interface TransactionListProps {
    transactions: Transaction[];
    onEditTransaction: (t: Transaction) => void;
    onDeleteTransaction: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onEditTransaction, onDeleteTransaction }) => {
    const [filter, setFilter] = useState('');
    
    const sorted = [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .filter(t => t.description.toLowerCase().includes(filter.toLowerCase()) || t.category.toLowerCase().includes(filter.toLowerCase()));

    const isOverdue = (t: Transaction) => {
        return t.type === 'expense' && !t.isPaid && new Date(t.date) < new Date();
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                 <h2 className="text-2xl font-bold text-white">Extrato do Mês</h2>
                 <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar..." 
                        className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-lg focus:border-cyan-500 outline-none"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                 </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-slate-400 text-xs uppercase">
                            <tr>
                                <th className="p-4">Status</th>
                                <th className="p-4">Descrição</th>
                                <th className="p-4">Categoria</th>
                                <th className="p-4">Data</th>
                                <th className="p-4 text-right">Valor</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300 divide-y divide-slate-700">
                            {sorted.map(t => {
                                const overdue = isOverdue(t);
                                return (
                                    <tr key={t.id} className="hover:bg-slate-700/50 transition-colors group">
                                        <td className="p-4">
                                            {overdue ? (
                                                <span className="flex items-center gap-1 text-red-500 font-bold text-xs bg-red-900/20 px-2 py-1 rounded border border-red-900 w-fit">
                                                    <AlertCircle size={12} /> Atrasado
                                                </span>
                                            ) : (
                                                t.isPaid ? (
                                                     <span className="text-emerald-400 font-bold text-xs bg-emerald-900/20 px-2 py-1 rounded border border-emerald-900 w-fit">
                                                        Pago
                                                    </span>
                                                ) : (
                                                     <span className="text-yellow-400 font-bold text-xs bg-yellow-900/20 px-2 py-1 rounded border border-yellow-900 w-fit">
                                                        Pendente
                                                    </span>
                                                )
                                            )}
                                        </td>
                                        <td className="p-4 font-medium text-white flex items-center gap-2">
                                            {t.description}
                                            {t.loanId && <span className="text-xs text-slate-500 border border-slate-700 px-1 rounded">Financ.</span>}
                                            {t.recurrenceId && <Repeat size={12} className="text-slate-500" />}
                                        </td>
                                        <td className="p-4 text-slate-400">{t.category}</td>
                                        <td className="p-4">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                        <td className="p-4 text-right">
                                            <div className={`flex items-center justify-end gap-2 font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-fuchsia-400'}`}>
                                                {t.type === 'income' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                                                R$ {t.amount.toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => onEditTransaction(t)}
                                                    className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => onDeleteTransaction(t.id)}
                                                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {sorted.length === 0 && (
                    <div className="p-8 text-center text-slate-500">Nenhum lançamento neste mês.</div>
                )}
            </div>
        </div>
    );
};
