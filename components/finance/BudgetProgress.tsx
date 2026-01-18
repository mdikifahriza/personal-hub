import { PiggyBank } from 'lucide-react';

interface Budget {
  id: string;
  category_name: string;
  category_icon: string;
  spent: number;
  limit: number;
  percentage: number;
}

interface BudgetProgressProps {
  budgets: Budget[];
}

export default function BudgetProgress({ budgets }: BudgetProgressProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressBg = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-100';
    if (percentage >= 80) return 'bg-orange-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <PiggyBank className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Status Budget</h3>
      </div>
      
      <div className="space-y-4">
        {budgets.map((budget) => (
          <div key={budget.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{budget.category_icon}</span>
                <span className="font-medium text-gray-900 text-sm">
                  {budget.category_name}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                </p>
                <p className={`text-xs font-medium ${
                  budget.percentage >= 80 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {budget.percentage}%
                </p>
              </div>
            </div>
            
            <div className={`h-2 rounded-full overflow-hidden ${getProgressBg(budget.percentage)}`}>
              <div
                className={`h-full transition-all duration-300 ${getProgressColor(budget.percentage)}`}
                style={{ width: `${Math.min(budget.percentage, 100)}%` }}
              />
            </div>
            
            {budget.percentage >= 80 && (
              <p className="text-xs text-red-600">
                {budget.percentage >= 100 
                  ? '⚠️ Budget terlampaui!' 
                  : '⚠️ Mendekati batas budget'}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}