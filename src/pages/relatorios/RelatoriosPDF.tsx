
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportData {
  periodo: string;
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  receitas: any[];
  despesas: any[];
  contasPagar: any[];
  contasReceber: any[];
}

export default function RelatoriosPDF() {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tipoRelatorio, setTipoRelatorio] = useState<'mensal' | 'anual'>('mensal');
  const [mesAno, setMesAno] = useState(format(new Date(), 'yyyy-MM'));
  const [ano, setAno] = useState(new Date().getFullYear());

  useEffect(() => {
    if (user) {
      loadReportData();
    }
  }, [user, tipoRelatorio, mesAno, ano]);

  const loadReportData = async () => {
    if (!user) return;

    setLoading(true);

    try {
      let startDate: Date;
      let endDate: Date;
      let periodo: string;

      if (tipoRelatorio === 'mensal') {
        const [year, month] = mesAno.split('-').map(Number);
        startDate = startOfMonth(new Date(year, month - 1));
        endDate = endOfMonth(new Date(year, month - 1));
        periodo = format(startDate, 'MMMM yyyy', { locale: ptBR });
      } else {
        startDate = startOfYear(new Date(ano, 0));
        endDate = endOfYear(new Date(ano, 0));
        periodo = ano.toString();
      }

      // Carregar dados
      const [receitasRes, despesasRes, contasPagarRes, contasReceberRes] = await Promise.all([
        supabase
          .from('receitas')
          .select('*')
          .eq('user_id', user.id)
          .gte('data', format(startDate, 'yyyy-MM-dd'))
          .lte('data', format(endDate, 'yyyy-MM-dd'))
          .order('data', { ascending: false }),
        
        supabase
          .from('despesas')
          .select('*')
          .eq('user_id', user.id)
          .gte('data', format(startDate, 'yyyy-MM-dd'))
          .lte('data', format(endDate, 'yyyy-MM-dd'))
          .order('data', { ascending: false }),
        
        supabase
          .from('contas_pagar')
          .select('*')
          .eq('user_id', user.id)
          .gte('vencimento', format(startDate, 'yyyy-MM-dd'))
          .lte('vencimento', format(endDate, 'yyyy-MM-dd'))
          .order('vencimento', { ascending: false }),
        
        supabase
          .from('contas_receber')
          .select('*')
          .eq('user_id', user.id)
          .gte('vencimento', format(startDate, 'yyyy-MM-dd'))
          .lte('vencimento', format(endDate, 'yyyy-MM-dd'))
          .order('vencimento', { ascending: false })
      ]);

      const receitas = receitasRes.data || [];
      const despesas = despesasRes.data || [];
      const contasPagar = contasPagarRes.data || [];
      const contasReceber = contasReceberRes.data || [];

      const totalReceitas = receitas.reduce((acc, item) => acc + item.valor, 0);
      const totalDespesas = despesas.reduce((acc, item) => acc + item.valor, 0);

      setReportData({
        periodo,
        totalReceitas,
        totalDespesas,
        saldo: totalReceitas - totalDespesas,
        receitas,
        despesas,
        contasPagar,
        contasReceber
      });
    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!reportData || !user) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Função para adicionar nova página se necessário
    const checkNewPage = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
    };

    // Cabeçalho
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('FinanceMEI', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    pdf.setFontSize(16);
    pdf.text(`Relatório ${tipoRelatorio === 'mensal' ? 'Mensal' : 'Anual'}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Período: ${reportData.periodo}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    pdf.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Resumo Financeiro
    checkNewPage(40);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RESUMO FINANCEIRO', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    // Tabela de resumo
    const resumoData = [
      ['Total de Receitas', formatCurrency(reportData.totalReceitas)],
      ['Total de Despesas', formatCurrency(reportData.totalDespesas)],
      ['Saldo do Período', formatCurrency(reportData.saldo)]
    ];

    resumoData.forEach(([label, value]) => {
      pdf.text(label, 25, yPosition);
      pdf.text(value, pageWidth - 25, yPosition, { align: 'right' });
      yPosition += 6;
    });

    yPosition += 10;

    // Receitas
    if (reportData.receitas.length > 0) {
      checkNewPage(30);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RECEITAS', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      // Cabeçalho da tabela
      const headers = ['Data', 'Descrição', 'Categoria', 'Valor', 'Status'];
      const colWidths = [25, 60, 40, 25, 20];
      let xPos = 20;
      
      pdf.setFont('helvetica', 'bold');
      headers.forEach((header, i) => {
        pdf.text(header, xPos, yPosition);
        xPos += colWidths[i];
      });
      yPosition += 6;

      pdf.setFont('helvetica', 'normal');
      reportData.receitas.forEach(receita => {
        checkNewPage(8);
        xPos = 20;
        
        const row = [
          format(new Date(receita.data), 'dd/MM/yy'),
          receita.descricao.substring(0, 25),
          receita.categoria.substring(0, 15),
          formatCurrency(receita.valor),
          receita.recebido ? 'Recebido' : 'Pendente'
        ];

        row.forEach((cell, i) => {
          pdf.text(cell, xPos, yPosition);
          xPos += colWidths[i];
        });
        yPosition += 5;
      });
      yPosition += 10;
    }

    // Despesas
    if (reportData.despesas.length > 0) {
      checkNewPage(30);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DESPESAS', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      const headers = ['Data', 'Descrição', 'Categoria', 'Valor', 'Status'];
      const colWidths = [25, 60, 40, 25, 20];
      let xPos = 20;
      
      pdf.setFont('helvetica', 'bold');
      headers.forEach((header, i) => {
        pdf.text(header, xPos, yPosition);
        xPos += colWidths[i];
      });
      yPosition += 6;

      pdf.setFont('helvetica', 'normal');
      reportData.despesas.forEach(despesa => {
        checkNewPage(8);
        xPos = 20;
        
        const row = [
          format(new Date(despesa.data), 'dd/MM/yy'),
          despesa.descricao.substring(0, 25),
          despesa.categoria.substring(0, 15),
          formatCurrency(despesa.valor),
          despesa.pago ? 'Pago' : 'Pendente'
        ];

        row.forEach((cell, i) => {
          pdf.text(cell, xPos, yPosition);
          xPos += colWidths[i];
        });
        yPosition += 5;
      });
      yPosition += 10;
    }

    // Rodapé
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      pdf.text(`${user.nome} - ${user.email}`, 20, pageHeight - 10);
    }

    // Salvar PDF
    const fileName = `financemei-relatorio-${tipoRelatorio}-${reportData.periodo.replace(/\s+/g, '-')}.pdf`;
    pdf.save(fileName);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Relatórios em PDF</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Relatório
            </label>
            <select
              value={tipoRelatorio}
              onChange={(e) => setTipoRelatorio(e.target.value as 'mensal' | 'anual')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-8"
            >
              <option value="mensal">Relatório Mensal</option>
              <option value="anual">Relatório Anual</option>
            </select>
          </div>
          
          {tipoRelatorio === 'mensal' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mês/Ano
              </label>
              <input
                type="month"
                value={mesAno}
                onChange={(e) => setMesAno(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ano
              </label>
              <input
                type="number"
                value={ano}
                onChange={(e) => setAno(parseInt(e.target.value))}
                min="2020"
                max="2030"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          )}
          
          <div className="flex items-end">
            <button
              onClick={generatePDF}
              disabled={loading || !reportData}
              className="w-full py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap flex items-center justify-center"
            >
              <i className="ri-file-pdf-line mr-2"></i>
              {loading ? 'Gerando...' : 'Gerar PDF'}
            </button>
          </div>
        </div>

        {reportData && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Preview - {reportData.periodo}
            </h3>
            
            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-100 rounded-lg p-4">
                <p className="text-sm text-green-700">Total Receitas</p>
                <p className="text-xl font-bold text-green-800">
                  {formatCurrency(reportData.totalReceitas)}
                </p>
              </div>
              
              <div className="bg-red-100 rounded-lg p-4">
                <p className="text-sm text-red-700">Total Despesas</p>
                <p className="text-xl font-bold text-red-800">
                  {formatCurrency(reportData.totalDespesas)}
                </p>
              </div>
              
              <div className={`rounded-lg p-4 ${reportData.saldo >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                <p className={`text-sm ${reportData.saldo >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                  Saldo
                </p>
                <p className={`text-xl font-bold ${reportData.saldo >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                  {formatCurrency(reportData.saldo)}
                </p>
              </div>
            </div>

            {/* Contadores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{reportData.receitas.length}</p>
                <p className="text-sm text-gray-600">Receitas</p>
              </div>
              
              <div>
                <p className="text-2xl font-bold text-gray-900">{reportData.despesas.length}</p>
                <p className="text-sm text-gray-600">Despesas</p>
              </div>
              
              <div>
                <p className="text-2xl font-bold text-gray-900">{reportData.contasPagar.length}</p>
                <p className="text-sm text-gray-600">Contas a Pagar</p>
              </div>
              
              <div>
                <p className="text-2xl font-bold text-gray-900">{reportData.contasReceber.length}</p>
                <p className="text-sm text-gray-600">Contas a Receber</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Dicas */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Dicas para Relatórios</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <i className="ri-check-line mr-2 mt-0.5 text-blue-600"></i>
            Use relatórios mensais para acompanhar sua performance
          </li>
          <li className="flex items-start">
            <i className="ri-check-line mr-2 mt-0.5 text-blue-600"></i>
            Relatórios anuais são ideais para declaração de imposto
          </li>
          <li className="flex items-start">
            <i className="ri-check-line mr-2 mt-0.5 text-blue-600"></i>
            Mantenha seus dados sempre atualizados para relatórios precisos
          </li>
          <li className="flex items-start">
            <i className="ri-check-line mr-2 mt-0.5 text-blue-600"></i>
            Os PDFs incluem todas as transações do período selecionado
          </li>
        </ul>
      </div>
    </div>
  );
}
