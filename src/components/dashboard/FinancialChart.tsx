
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChartData {
  month: string;
  receitas: number;
  despesas: number;
  lucro: number;
}

export default function FinancialChart() {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(6);

  useEffect(() => {
    if (user) {
      loadChartData();
    }
  }, [user, selectedPeriod]);

  const loadChartData = async () => {
    if (!user) return;

    setLoading(true);
    const data: ChartData[] = [];

    try {
      for (let i = selectedPeriod - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const startDate = startOfMonth(date);
        const endDate = endOfMonth(date);
        
        const monthName = format(date, 'MMM/yy', { locale: ptBR });

        // Buscar receitas do mês
        const { data: receitas } = await supabase
          .from('receitas')
          .select('valor')
          .eq('user_id', user.id)
          .gte('data', format(startDate, 'yyyy-MM-dd'))
          .lte('data', format(endDate, 'yyyy-MM-dd'));

        // Buscar despesas do mês
        const { data: despesas } = await supabase
          .from('despesas')
          .select('valor')
          .eq('user_id', user.id)
          .gte('data', format(startDate, 'yyyy-MM-dd'))
          .lte('data', format(endDate, 'yyyy-MM-dd'));

        const totalReceitas = receitas?.reduce((acc, item) => acc + item.valor, 0) || 0;
        const totalDespesas = despesas?.reduce((acc, item) => acc + item.valor, 0) || 0;
        const lucro = totalReceitas - totalDespesas;

        data.push({
          month: monthName,
          receitas: totalReceitas,
          despesas: totalDespesas,
          lucro
        });
      }

      setChartData(data);
    } catch (error) {
      console.error('Erro ao carregar dados do gráfico:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxValue = Math.max(
    ...chartData.flatMap(item => [item.receitas, item.despesas])
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <i className="ri-line-chart-line mr-2 text-blue-600"></i>
          Evolução Financeira
        </h3>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedPeriod(3)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              selectedPeriod === 3
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            3M
          </button>
          <button
            onClick={() => setSelectedPeriod(6)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              selectedPeriod === 6
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            6M
          </button>
          <button
            onClick={() => setSelectedPeriod(12)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              selectedPeriod === 12
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            12M
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="text-center py-12">
          <i className="ri-bar-chart-line text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500">Nenhum dado financeiro encontrado</p>
          <p className="text-sm text-gray-400">Adicione receitas e despesas para ver o gráfico</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Legenda */}
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-600">Receitas</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-600">Despesas</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-600">Lucro</span>
            </div>
          </div>

          {/* Gráfico */}
          <div className="relative h-64 overflow-x-auto">
            <div className="flex items-end justify-between h-full min-w-full space-x-2 px-2">
              {chartData.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center space-y-2">
                  {/* Barras */}
                  <div className="relative flex items-end space-x-1 h-48 w-full max-w-16">
                    {/* Receitas */}
                    <div className="relative group">
                      <div
                        className="bg-green-500 rounded-t transition-all hover:bg-green-600 cursor-pointer"
                        style={{
                          height: `${(item.receitas / maxValue) * 180}px`,
                          width: '16px',
                          minHeight: item.receitas > 0 ? '4px' : '0px'
                        }}
                      ></div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Receitas: {formatCurrency(item.receitas)}
                      </div>
                    </div>

                    {/* Despesas */}
                    <div className="relative group">
                      <div
                        className="bg-red-500 rounded-t transition-all hover:bg-red-600 cursor-pointer"
                        style={{
                          height: `${(item.despesas / maxValue) * 180}px`,
                          width: '16px',
                          minHeight: item.despesas > 0 ? '4px' : '0px'
                        }}
                      ></div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Despesas: {formatCurrency(item.despesas)}
                      </div>
                    </div>

                    {/* Lucro */}
                    <div className="relative group">
                      <div
                        className={`rounded-t transition-all cursor-pointer ${
                          item.lucro >= 0 ? 'bg-blue-500 hover:bg-blue-600' : 'bg-orange-500 hover:bg-orange-600'
                        }`}
                        style={{
                          height: `${(Math.abs(item.lucro) / maxValue) * 180}px`,
                          width: '16px',
                          minHeight: item.lucro !== 0 ? '4px' : '0px'
                        }}
                      ></div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {item.lucro >= 0 ? 'Lucro' : 'Prejuízo'}: {formatCurrency(Math.abs(item.lucro))}
                      </div>
                    </div>
                  </div>

                  {/* Mês */}
                  <div className="text-xs text-gray-600 font-medium">
                    {item.month}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Receitas</div>
              <div className="text-lg font-semibold text-green-600">
                {formatCurrency(chartData.reduce((acc, item) => acc + item.receitas, 0))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Despesas</div>
              <div className="text-lg font-semibold text-red-600">
                {formatCurrency(chartData.reduce((acc, item) => acc + item.despesas, 0))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Lucro Líquido</div>
              <div className={`text-lg font-semibold ${
                chartData.reduce((acc, item) => acc + item.lucro, 0) >= 0 
                  ? 'text-blue-600' 
                  : 'text-orange-600'
              }`}>
                {formatCurrency(chartData.reduce((acc, item) => acc + item.lucro, 0))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
