import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function SimuladorCusto() {
  const [salarioBase, setSalarioBase] = useState<number>(2500);
  const [valeTransporte, setValeTransporte] = useState<number>(0);
  const [valeAlimentacao, setValeAlimentacao] = useState<number>(0);
  const [planoSaude, setPlanoSaude] = useState<number>(0);
  const [outrosBeneficios, setOutrosBeneficios] = useState<number>(0);

  // Cálculos automáticos
  const [custos, setCustos] = useState({
    fgts: 0,
    feriasProvisionadas: 0,
    umTercoFerias: 0,
    decimoTerceiroProvisionado: 0,
    fgtsSobreDecimo: 0,
    fgtsSobreFerias: 0,
    inssDescontado: 0,
    irrfDescontado: 0,
    custoFuncionario: 0,
    custoTotal: 0
  });

  useEffect(() => {
    calcularCustos();
  }, [salarioBase, valeTransporte, valeAlimentacao, planoSaude, outrosBeneficios]);

  const calcularCustos = () => {
    const salario = salarioBase || 0;
    
    // FGTS (8%)
    const fgts = salario * 0.08;
    
    // Férias Provisionadas (1/12)
    const feriasProvisionadas = salario / 12;
    
    // 1/3 de Férias
    const umTercoFerias = feriasProvisionadas / 3;
    
    // 13º Salário Provisionado (1/12)
    const decimoTerceiroProvisionado = salario / 12;
    
    // FGTS sobre 13º Salário
    const fgtsSobreDecimo = decimoTerceiroProvisionado * 0.08;
    
    // FGTS sobre 1/3 de Férias
    const fgtsSobreFerias = umTercoFerias * 0.08;
    
    // INSS Descontado (baseado na tabela 2024)
    let inssDescontado = 0;
    if (salario <= 1412.00) {
      inssDescontado = salario * 0.075;
    } else if (salario <= 2666.68) {
      inssDescontado = 105.90 + (salario - 1412.00) * 0.09;
    } else if (salario <= 4000.03) {
      inssDescontado = 105.90 + 112.94 + (salario - 2666.68) * 0.12;
    } else if (salario <= 7786.02) {
      inssDescontado = 105.90 + 112.94 + 160.00 + (salario - 4000.03) * 0.14;
    } else {
      inssDescontado = 908.85; // Teto máximo
    }
    
    // IRRF Descontado (baseado na tabela 2024)
    let irrfDescontado = 0;
    const baseIrrf = salario - inssDescontado - (184.40 * 1); // 1 dependente padrão
    if (baseIrrf > 1903.98 && baseIrrf <= 2826.65) {
      irrfDescontado = baseIrrf * 0.075 - 142.80;
    } else if (baseIrrf > 2826.65 && baseIrrf <= 3751.05) {
      irrfDescontado = baseIrrf * 0.15 - 354.80;
    } else if (baseIrrf > 3751.05 && baseIrrf <= 4664.68) {
      irrfDescontado = baseIrrf * 0.225 - 636.13;
    } else if (baseIrrf > 4664.68) {
      irrfDescontado = baseIrrf * 0.275 - 869.36;
    }
    irrfDescontado = Math.max(0, irrfDescontado);
    
    // Custo do funcionário (sem encargos da empresa)
    const custoFuncionario = salario - inssDescontado - irrfDescontado;
    
    // Custo total mensal aproximado
    const custoTotal = salario + fgts + feriasProvisionadas + umTercoFerias + 
                      decimoTerceiroProvisionado + fgtsSobreDecimo + fgtsSobreFerias +
                      valeTransporte + valeAlimentacao + planoSaude + outrosBeneficios;

    setCustos({
      fgts,
      feriasProvisionadas,
      umTercoFerias,
      decimoTerceiroProvisionado,
      fgtsSobreDecimo,
      fgtsSobreFerias,
      inssDescontado,
      irrfDescontado,
      custoFuncionario,
      custoTotal
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/contratacao-funcionarios">
            <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Contratação
            </Button>
          </Link>
          <div className="text-center">
            <div className="flex justify-center items-center mb-6">
              <div className="bg-blue-600 p-4 rounded-lg mb-4">
                <Calculator className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Simulador de Custo de Funcionário
            </h1>
            <p className="text-gray-300">
              Calcule automaticamente todos os custos trabalhistas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Entrada */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Dados para Simulação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="salarioBase" className="text-gray-200">Salário Base (R$):</Label>
                <Input
                  id="salarioBase"
                  type="number"
                  value={salarioBase}
                  onChange={(e) => setSalarioBase(Number(e.target.value))}
                  placeholder="2.500,00"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="valeTransporte" className="text-gray-200">Vale Transporte (R$):</Label>
                <Input
                  id="valeTransporte"
                  type="number"
                  value={valeTransporte}
                  onChange={(e) => setValeTransporte(Number(e.target.value))}
                  placeholder="Digite o valor do Vale Transporte"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="valeAlimentacao" className="text-gray-200">Vale Alimentação (R$):</Label>
                <Input
                  id="valeAlimentacao"
                  type="number"
                  value={valeAlimentacao}
                  onChange={(e) => setValeAlimentacao(Number(e.target.value))}
                  placeholder="Digite o valor do Vale Alimentação"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="planoSaude" className="text-gray-200">Plano de Saúde (R$):</Label>
                <Input
                  id="planoSaude"
                  type="number"
                  value={planoSaude}
                  onChange={(e) => setPlanoSaude(Number(e.target.value))}
                  placeholder="Digite o valor do Plano de Saúde"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="outrosBeneficios" className="text-gray-200">Outros Benefícios (R$):</Label>
                <Input
                  id="outrosBeneficios"
                  type="number"
                  value={outrosBeneficios}
                  onChange={(e) => setOutrosBeneficios(Number(e.target.value))}
                  placeholder="Digite o valor de outros benefícios"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Resultado da Simulação */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-xl">
                CUSTO TOTAL MENSAL APROXIMADO: {formatCurrency(custos.custoTotal)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Detalhamento */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">DETALHAMENTO:</h3>
                <div className="space-y-2 text-gray-300">
                  <div>Salário Base: {formatCurrency(salarioBase)}</div>
                  <div>FGTS (8%): {formatCurrency(custos.fgts)}</div>
                  <div>Férias Provisionadas (1/12): {formatCurrency(custos.feriasProvisionadas)}</div>
                  <div>1/3 de Férias: {formatCurrency(custos.umTercoFerias)}</div>
                  <div>13º Salário Provisionado (1/12): {formatCurrency(custos.decimoTerceiroProvisionado)}</div>
                  <div>FGTS sobre 13º Salário: {formatCurrency(custos.fgtsSobreDecimo)}</div>
                  <div>FGTS sobre 1/3 de Férias: {formatCurrency(custos.fgtsSobreFerias)}</div>
                </div>
              </div>

              {/* Benefícios */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">BENEFÍCIOS:</h3>
                <div className="space-y-2 text-gray-300">
                  <div>Vale Transporte: {formatCurrency(valeTransporte)}</div>
                  <div>Vale Alimentação: {formatCurrency(valeAlimentacao)}</div>
                  <div>Plano de Saúde: {formatCurrency(planoSaude)}</div>
                  <div>Outros Benefícios: {formatCurrency(outrosBeneficios)}</div>
                </div>
              </div>

              {/* Descontos do Funcionário */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">DESCONTOS DO FUNCIONÁRIO:</h3>
                <div className="space-y-2 text-gray-300">
                  <div>INSS Descontado: {formatCurrency(custos.inssDescontado)}</div>
                  <div>IRRF Descontado: {formatCurrency(custos.irrfDescontado)}</div>
                </div>
              </div>

              {/* Custo Final */}
              <div className="border-t border-gray-600 pt-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  CUSTO DO FUNCIONÁRIO (sem encargos da empresa): {formatCurrency(custos.custoFuncionario)}
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botão para voltar à contratação */}
        <div className="flex justify-center mt-8">
          <Link href="/contratacao-funcionarios">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
              Usar estes dados na contratação
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400">
          <p className="text-sm">
            * Valores aproximados baseados na legislação trabalhista vigente em 2024
          </p>
          <p className="text-sm">
            © 2024 Prosperar Contabilidade - Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}