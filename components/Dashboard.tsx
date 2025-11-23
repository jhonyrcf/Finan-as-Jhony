
import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, Wallet, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  onAddClick: () => void;
  currentDate: Date;
  totalOverdueCount: number;
}

const COLORS = ['#00C1AF', '#D946EF', '#3B82F6', '#F59E0B'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, onAddClick, currentDate, totalOverdueCount }) => {
  
  // Summary Calculations (Current Month)
  const summary = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = income - expense;
    
    return { income, expense, balance };
  }, [transactions]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Line/Area Chart Data (Cashflow)
    const flowData = sorted.map(t => ({
        date: new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit' }),
        amount: t.type === 'income' ? t.amount : -t.amount,
        description: t.description // for tooltip
    }));

    // Pie Chart Data (Categories)
    const categoryMap: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });
    const pieData = Object.keys(categoryMap).map(k => ({ name: k, value: categoryMap[k] }));

    return { flowData, pieData };
  }, [transactions]);

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long' });

  return (
    <div className="space-y-6 pb-20">
        <h2 className="text-xl font-bold text-white capitalize">Resumo de {monthName}</h2>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg flex items-center justify-between">
                <div>
                    <p className="text-slate-400 text-sm">Receitas</p>
                    <p className="text-2xl font-bold text-emerald-400">R$ {summary.income.toFixed(2)}</p>
                </div>
                <ArrowUpCircle className="text-emerald-400 w-10 h-10 opacity-80" />
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg flex items-center justify-between">
                <div>
                    <p className="text-slate-400 text-sm">Despesas</p>
                    <p className="text-2xl font-bold text-fuchsia-400">R$ {summary.expense.toFixed(2)}</p>
                </div>
                <ArrowDownCircle className="text-fuchsia-400 w-10 h-10 opacity-80" />
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg flex items-center justify-between">
                <div>
                    <p className="text-slate-400 text-sm">Saldo Mensal</p>
                    <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                        R$ {summary.balance.toFixed(2)}
                    </p>
                </div>
                <Wallet className="text-cyan-400 w-10 h-10 opacity-80" />
            </div>
            
            {/* Global Overdue Card - Always shows if there are ANY overdue bills, regardless of month selection */}
            {totalOverdueCount > 0 && (
                 <div className="bg-red-900/20 p-4 rounded-xl border border-red-500/50 shadow-lg flex items-center justify-between animate-pulse">
                    <div>
                        <p className="text-red-300 text-sm">Contas em Atraso</p>
                        <p className="text-2xl font-bold text-red-500">{totalOverdueCount}</p>
                        <p className="text-xs text-red-400/70">(Total Geral)</p>
                    </div>
                    <AlertTriangle className="text-red-500 w-10 h-10" />
                </div>
            )}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Area Chart - Cash Flow */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Fluxo Diário</h3>
                {chartData.flowData.length > 0 ? (
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData.flowData}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                    itemStyle={{ color: '#22d3ee' }}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-64 w-full flex items-center justify-center text-slate-500">
                        Sem dados para este mês.
                    </div>
                )}
            </div>

            {/* Pie Chart - Categories */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Despesas por Categoria</h3>
                {chartData.pieData.length > 0 ? (
                    <>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData.pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {chartData.pieData.slice(0, 4).map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-1 text-xs text-slate-300">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                {entry.name}
                            </div>
                        ))}
                    </div>
                    </>
                ) : (
                    <div className="h-64 w-full flex items-center justify-center text-slate-500">
                        Sem despesas neste mês.
                    </div>
                )}
            </div>
             
             {/* Bar Chart - Balance Overview */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg col-span-1 lg:col-span-2">
                <h3 className="text-lg font-semibold text-white mb-4">Comparativo Entrada vs Saída</h3>
                 <div className="h-64 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={[
                             { name: 'Entradas', value: summary.income },
                             { name: 'Saídas', value: summary.expense }
                         ]}>
                             <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                             <XAxis dataKey="name" stroke="#94a3b8" />
                             <YAxis stroke="#94a3b8" />
                             <Tooltip cursor={{fill: '#334155', opacity: 0.2}} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                             <Bar dataKey="value" fill="#d946ef" radius={[4, 4, 0, 0]}>
                                {
                                    [summary.income, summary.expense].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#d946ef'} />
                                    ))
                                }
                             </Bar>
                         </BarChart>
                     </ResponsiveContainer>
                 </div>
            </div>

        </div>

        <button 
            onClick={onAddClick}
            className="fixed bottom-6 right-6 bg-cyan-500 hover:bg-cyan-400 text-black font-bold p-4 rounded-full shadow-lg shadow-cyan-500/30 transition-transform hover:scale-110 z-40"
        >
            + Nova Transação
        </button>
    </div>
  );
};
