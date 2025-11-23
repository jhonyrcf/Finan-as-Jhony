import React from 'react';
import { Investment } from '../types';
import { TrendingUp, Plus, Pencil, Trash2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface InvestmentsProps {
    investments: Investment[];
    onAddInvestment: () => void;
    onEditInvestment: (inv: Investment) => void;
    onDeleteInvestment: (id: string) => void;
}

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'];

export const Investments: React.FC<InvestmentsProps> = ({ investments, onAddInvestment, onEditInvestment, onDeleteInvestment }) => {
    
    const totalInvested = investments.reduce((acc, i) => acc + i.currentValue, 0);
    
    // Group for Pie Chart
    const typeDistribution = investments.reduce((acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + curr.currentValue;
        return acc;
    }, {} as Record<string, number>);
    
    const chartData = Object.keys(typeDistribution).map((key, index) => ({
        name: key,
        value: typeDistribution[key],
        color: COLORS[index % COLORS.length]
    }));

    return (
        <div className="space-y-6 pb-20">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Meus Investimentos</h2>
                <button onClick={onAddInvestment} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors">
                    <Plus size={18} /> Novo Aporte
                </button>
            </div>

            {/* Overview Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <p className="text-slate-400 text-sm mb-1">Patrimônio Total Investido</p>
                    <h3 className="text-3xl font-bold text-white flex items-center gap-2">
                        R$ {totalInvested.toFixed(2)}
                        <TrendingUp className="text-emerald-400 w-6 h-6" />
                    </h3>
                </div>
                <div className="h-32 w-32">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={chartData} dataKey="value" innerRadius={25} outerRadius={40} paddingAngle={5}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', fontSize: '10px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Asset List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {investments.map(inv => {
                    const profit = inv.currentValue - inv.amountInvested;
                    const profitPercent = (profit / inv.amountInvested) * 100;
                    const isPositive = profit >= 0;

                    return (
                        <div key={inv.id} className="group relative bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-blue-500/50 transition-colors">
                            {/* Action Buttons */}
                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onEditInvestment(inv)} className="text-slate-400 hover:text-cyan-400"><Pencil size={14} /></button>
                                <button onClick={() => onDeleteInvestment(inv.id)} className="text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
                            </div>

                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className="text-xs font-bold text-blue-400 bg-blue-900/30 px-2 py-1 rounded uppercase">{inv.type}</span>
                                    <h4 className="text-lg font-bold text-white mt-2">{inv.name}</h4>
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {isPositive ? '+' : ''}{profitPercent.toFixed(2)}%
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 border-t border-slate-700 pt-3 mt-2">
                                <div>
                                    <p className="text-xs text-slate-500">Aplicado</p>
                                    <p className="text-slate-300 font-medium">R$ {inv.amountInvested.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500">Atual</p>
                                    <p className="text-white font-bold text-lg">R$ {inv.currentValue.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}