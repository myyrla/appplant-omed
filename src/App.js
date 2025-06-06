import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Checkbox } from './components/ui/checkbox';
import { Textarea } from './components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './components/ui/select';
import { eachHourOfInterval, addHours, format, isValid, subMilliseconds } from 'date-fns'; // Importei isValid e subMilliseconds

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import './style.css'; // Certifique-se de que este arquivo existe e contém os estilos

export default function PlantaoApp() {
  const [etapa, setEtapa] = useState('inicio');
  const [tipoPlantao, setTipoPlantao] = useState('');
  const [dataInicioPlantao, setDataInicioPlantao] = useState('');
  const [dataFimPlantao, setDataFimPlantao] = useState('');
  const [horaInicioPlantao, setHoraInicioPlantao] = useState('');
  const [horaFimPlantao, setHoraFimPlantao] = useState('');
  const [nomePlantonista, setNomePlantonista] = useState('');
  const [totalFixo, setTotalFixo] = useState(0);
  const [totalGeral, setTotalGeral] = useState(0);

  const [pacientes, setPacientes] = useState([]);
  const [nomePaciente, setNomePaciente] = useState('');
  const [inicial, setInicial] = useState(false);
  const [retorno, setRetorno] = useState(false);
  const [reavaliacao, setReavaliacao] = useState(false);
  const [desfecho, setDesfecho] = useState(false);
  const [obs, setObs] = useState('');
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    if (tipoPlantao === 'Lider' && dataInicioPlantao) {
      setDataFimPlantao(dataInicioPlantao);
    }
  }, [tipoPlantao, dataInicioPlantao]);

  const calcularValorPaciente = (p) => {
    let valor = 0;
    if (p.inicial) valor += 20;
    if (p.retorno && p.inicial) valor += 10;
    if (p.reavaliacao && !p.inicial) valor += 10;
    if (p.desfecho) valor += 10;
    return Math.min(valor, 30);
  };

  const totalProdutividade = useMemo(
    () => pacientes.reduce((t, p) => t + calcularValorPaciente(p), 0),
    [pacientes]
  );

  const calcularValorFixo = () => {
    if (
      !dataInicioPlantao ||
      !tipoPlantao ||
      (tipoPlantao === 'PA' && (!horaInicioPlantao || !horaFimPlantao))
    ) {
      return 0;
    }

    const startDateTimeString =
      tipoPlantao === 'Lider'
        ? `${dataInicioPlantao}T09:00:00`
        : `${dataInicioPlantao}T${horaInicioPlantao}:00`;
    // Adjusted endDateTimeString to ensure it uses dataFimPlantao correctly for PA
    const endDateTimeString =
      tipoPlantao === 'Lider'
        ? `${dataFimPlantao}T17:00:00`
        : `${dataFimPlantao}T${horaFimPlantao}:00`;


    const dataInicio = new Date(startDateTimeString);
    const dataFim = new Date(endDateTimeString);

    if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime()) || dataFim.getTime() <= dataInicio.getTime()) {
      console.error(
        'Datas ou horas inválidas ou período de término antes/igual ao de início para cálculo de valor fixo.'
      );
      return 0;
    }

    // Correção: Use addHours(dataFim, -1) para tornar o final do intervalo exclusivo
    const hoursInterval = eachHourOfInterval({
      start: dataInicio,
      end: addHours(dataFim, -1),
    });

    // --- Início da seção de depuração para cálculo fixo ---
    console.log('--- Debugging Fixed Value Calculation ---');
    console.log('Tipo de Plantão:', tipoPlantao);
    console.log('Data/Hora Início (parsed):', dataInicio.toISOString());
    console.log('Data/Hora Fim (parsed):', dataFim.toISOString());
    console.log('Data/Hora Fim enviada para eachHourOfInterval (subtraindo 1 hora):', addHours(dataFim, -1).toISOString());
    console.log('Horas no intervalo gerado (apenas início da hora):', hoursInterval.map(d => format(d, 'HH:mm')));
    console.log('Número de horas no intervalo:', hoursInterval.length);
    // --- Fim da seção de depuração para cálculo fixo ---

    return hoursInterval.reduce((total, hora) => {
      const h = hora.getHours(); // Hora atual do intervalo (ex: 13 para 13:00)
      const diaSemana = hora.getDay(); // 0 para Domingo, 6 para Sábado
      const fimDeSemana = diaSemana === 0 || diaSemana === 6; // Verifica se é Fim de Semana
      let valorHora = 0;

      if (tipoPlantao === 'PA') {
        // Horários para Pronto Atendimento
        if (fimDeSemana) {
          // Fim de semana
          valorHora = (h >= 7 && h < 19) ? 60 : 70; // 07h-19h é 60, 19h-07h (noturno) é 70
        } else {
          // Dia útil
          valorHora = (h >= 7 && h < 19) ? 50 : 70; // 07h-19h é 50, 19h-07h (noturno) é 70
        }
      } else if (tipoPlantao === 'Lider') {
        // Horários para Líder
        if (h >= 9 && h < 17) { // Para Líder, apenas o horário 09h-17h é considerado
          valorHora = fimDeSemana ? 80 : 70; // Fim de semana é 80, Dia útil é 70
        } else {
          valorHora = 0; // Horas fora do intervalo 09h-17h para Líder não contam para o fixo
        }
      }
      
      console.log(`Hora: ${format(hora, 'HH:mm')}, Dia Semana: ${diaSemana} (Fim de Semana: ${fimDeSemana}), Valor da Hora: ${valorHora}`);
      return total + valorHora;
    }, 0);
  };

  useEffect(() => {
    const fixo = calcularValorFixo();
    const total = fixo + totalProdutividade;
    setTotalFixo(fixo);
    setTotalGeral(total);
  }, [
    dataInicioPlantao,
    dataFimPlantao,
    tipoPlantao,
    horaInicioPlantao,
    horaFimPlantao,
    totalProdutividade,
  ]);

  const hexToRgb = (hex) => {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return [r, g, b];
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    // Removida a linha doc.addFont('ZapfDingbats', 'normal'); para evitar possíveis problemas

    let currentY = 20;
    const margin = 14;
    const primaryRed = hexToRgb('#b30c0c');
    const lightGray = [240, 240, 240];
    const darkGray = [50, 50, 50];
    const paddingAfterLabel = 2; // Espaçamento fixo após o rótulo

    // --- Início da seção de depuração ---
    console.log('--- Debugging PDF Filename Generation ---');
    console.log('Current nomePlantonista state:', nomePlantonista);
    console.log('Current dataInicioPlantao state:', dataInicioPlantao);
    // --- Fim da seção de depuração ---

    // Título Principal
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
    doc.text('Relatório de Plantão', margin, currentY);
    currentY += 10;
    doc.setDrawColor(primaryRed[0], primaryRed[1], primaryRed[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, currentY, doc.internal.pageSize.width - margin, currentY);
    currentY += 15;

    // Informações do Plantão
    const infoFontSize = 10;
    const lineHeight = 6;

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

    // Plantonista
    doc.setFontSize(infoFontSize);
    doc.setFont('helvetica', 'bold');
    const plantonistaLabel = 'Plantonista:';
    doc.text(plantonistaLabel, margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(
      nomePlantonista,
      margin + doc.getTextWidth(plantonistaLabel) + paddingAfterLabel,
      currentY
    );
    currentY += lineHeight;

    // Tipo de plantão
    doc.setFont('helvetica', 'bold');
    const tipoPlantaoLabel = 'Tipo de plantão:';
    doc.text(tipoPlantaoLabel, margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(
      tipoPlantao === 'PA' ? 'Pronto Atendimento' : 'Líder',
      margin + doc.getTextWidth(tipoPlantaoLabel) + paddingAfterLabel,
      currentY
    );
    currentY += lineHeight;

    // Início
    doc.setFont('helvetica', 'bold');
    const inicioLabel = 'Início:';
    doc.text(inicioLabel, margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${dataInicioPlantao} ${
        tipoPlantao === 'PA' ? horaInicioPlantao : '09:00'
      }`,
      margin + doc.getTextWidth(inicioLabel) + paddingAfterLabel,
      currentY
    );
    currentY += lineHeight;

    // Término
    doc.setFont('helvetica', 'bold');
    const terminoLabel = 'Término:';
    doc.text(terminoLabel, margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${dataFimPlantao} ${tipoPlantao === 'PA' ? horaFimPlantao : '17:00'}`,
      margin + doc.getTextWidth(terminoLabel) + paddingAfterLabel,
      currentY
    );
    currentY += 10; // Espaçamento antes da tabela

    // Tabela de Pacientes
    if (pacientes.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text('Pacientes Registrados', margin, currentY);
      currentY += 7;

      autoTable(doc, {
        startY: currentY,
        head: [
          [
            'Nº',
            'Paciente',
            'Inicial',
            'Retorno',
            'Reavaliação',
            'Desfecho',
            'Obs',
            'Valor',
          ],
        ],
        body: pacientes.map((p, index) => [
          index + 1,
          p.nome,
          p.inicial ? 'X' : '', // Trocado para 'X'
          p.retorno ? 'X' : '', // Trocado para 'X'
          p.reavaliacao ? 'X' : '', // Trocado para 'X'
          p.desfecho ? 'X' : '', // Trocado para 'X'
          p.obs,
          `R$ ${calcularValorPaciente(p).toFixed(2)}`,
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: primaryRed,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 9,
          font: 'helvetica',
        },
        bodyStyles: {
          textColor: darkGray,
          valign: 'middle',
          fontSize: 8,
          font: 'helvetica',
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          2: { halign: 'center', cellWidth: 20 }, // Removida font: 'ZapfDingbats'
          3: { halign: 'center', cellWidth: 20 }, // Removida font: 'ZapfDingbats'
          4: { halign: 'center', cellWidth: 25 }, // Removida font: 'ZapfDingbats'
          5: { halign: 'center', cellWidth: 20 }, // Removida font: 'ZapfDingbats'
          7: { halign: 'right', cellWidth: 20 },
        },
        alternateRowStyles: {
          fillColor: lightGray,
        },
        margin: { top: currentY, left: margin, right: margin },
        didDrawPage: function (data) {
          let footerStr = 'Página ' + doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(150);
          doc.text(
            footerStr,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        },
      });
      currentY = doc.lastAutoTable.finalY + 15;
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text('Nenhum paciente registrado neste plantão.', margin, currentY);
      currentY += 15;
    }

    // Totais
    const totalFontSize = 11;
    const totalLineHeight = 6;

    doc.setFontSize(totalFontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(
      `Total produtividade: R$ ${totalProdutividade.toFixed(2)}`,
      margin,
      currentY
    );
    currentY += totalLineHeight;
    doc.text(
      `Valor fixo do plantão: R$ ${totalFixo.toFixed(2)}`,
      margin,
      currentY
    );
    currentY += totalLineHeight;
    doc.text(`Total geral: R$ ${totalGeral.toFixed(2)}`, margin, currentY);
    currentY += 10;

    // Rodapé final com data
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    const now = new Date();
    doc.text(
      `Gerado em: ${format(now, 'dd/MM/yyyy HH:mm:ss')}`,
      margin,
      doc.internal.pageSize.height - 10,
      { align: 'left' }
    );

    // Lógica para nomear o arquivo PDF
    const startDate = new Date(dataInicioPlantao);
    let formattedDate = '';
    if (dataInicioPlantao && isValid(startDate)) { // Verifica se a data é válida
        formattedDate = format(startDate, 'dd-MM-yyyy');
    } else {
        formattedDate = 'Data-Indefinida'; // Fallback para data inválida
    }

    const cleanedPlantonistaName = nomePlantonista.trim().replace(/\s+/g, '-'); // Remove espaços extras e substitui por hífen
    
    let filename = `relatorio-plantao.pdf`; // Nome de arquivo padrão
    if (cleanedPlantonistaName && formattedDate !== 'Data-Indefinida') {
        filename = `${cleanedPlantonistaName}-${formattedDate}.pdf`;
    } else if (cleanedPlantonistaName) {
        filename = `${cleanedPlantonistaName}-relatorio.pdf`;
    } else if (formattedDate !== 'Data-Indefinida') {
        filename = `relatorio-${formattedDate}.pdf`;
    }

    console.log('Final filename generated:', filename); // Confirma o nome final

    doc.save(filename);
  };

  const adicionarPaciente = () => {
    if (!nomePaciente.trim()) {
      // Alterado de alert para um console.error ou modal customizado se você tiver um.
      console.error('Por favor, insira o nome do paciente.');
      return;
    }

    const paciente = {
      nome: nomePaciente.trim(),
      inicial,
      retorno,
      reavaliacao,
      desfecho,
      obs,
    };
    if (editIndex !== null) {
      const novos = [...pacientes];
      novos[editIndex] = paciente;
      setPacientes(novos);
      setEditIndex(null);
    } else {
      setPacientes([...pacientes, paciente]);
    }
    setNomePaciente('');
    setInicial(false);
    setRetorno(false);
    setReavaliacao(false);
    setDesfecho(false);
    setObs('');
  };

  const editarPaciente = (index) => {
    const p = pacientes[index];
    setNomePaciente(p.nome);
    setInicial(p.inicial);
    setRetorno(p.retorno);
    setReavaliacao(p.reavaliacao);
    setDesfecho(p.desfecho);
    setObs(p.obs);
    setEditIndex(index);
  };

  const podeAvancarParaRegistro =
    nomePlantonista.trim() !== '' &&
    tipoPlantao !== '' &&
    dataInicioPlantao !== '' &&
    dataFimPlantao !== '' &&
    (tipoPlantao === 'Lider' ||
      (horaInicioPlantao !== '' && horaFimPlantao !== ''));

  const voltarParaInicio = () => {
    setEtapa('inicio');
  };

  if (etapa === 'inicio') {
    return (
      <div className="inicio-container">
        <div className="header-box">
          <h1>Início de Plantão</h1>
        </div>

        <div className="inicio-inputs">
          <label htmlFor="nome-plantonista">Nome do plantonista</label>
          <Input
            id="nome-plantonista"
            value={nomePlantonista}
            onChange={(e) => setNomePlantonista(e.target.value)}
          />

          <label htmlFor="tipo-plantao">Tipo de plantão</label>
          <Select value={tipoPlantao} onValueChange={setTipoPlantao}>
            <SelectTrigger className="SelectTrigger" id="tipo-plantao">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="SelectContent">
              <SelectItem value="PA">Pronto Atendimento</SelectItem>
              <SelectItem value="Lider">Líder</SelectItem>
            </SelectContent>
          </Select>

          <label htmlFor="data-inicio-plantao">Data de início do plantão</label>
          <Input
            id="data-inicio-plantao"
            type="date"
            value={dataInicioPlantao}
            onChange={(e) => setDataInicioPlantao(e.target.value)}
          />

          {tipoPlantao === 'PA' && (
            <>
              <label htmlFor="hora-inicio-plantao">
                Hora de início do plantão
              </label>
              <Input
                id="hora-inicio-plantao"
                type="time"
                value={horaInicioPlantao}
                onChange={(e) => setHoraInicioPlantao(e.target.value)}
              />
            </>
          )}

          {tipoPlantao === 'PA' && (
            <>
              <label htmlFor="data-fim-plantao">
                Data de término do plantão
              </label>
              <Input
                id="data-fim-plantao"
                type="date"
                value={dataFimPlantao}
                onChange={(e) => setDataFimPlantao(e.target.value)}
              />
            </>
          )}
          {tipoPlantao === 'Lider' && (
            <div className="text-sm text-gray-500 mt-2">
              <p>*Horário padrão: 09:00 - 17:00</p>
            </div>
          )}

          {tipoPlantao === 'PA' && (
            <>
              <label htmlFor="hora-fim-plantao">
                Hora de término do plantão
              </label>
              <Input
                id="hora-fim-plantao"
                type="time"
                value={horaFimPlantao}
                onChange={(e) => setHoraFimPlantao(e.target.value)}
              />
            </>
          )}
        </div>

        <div className="botoes-inicio">
          <Button
            onClick={() => setEtapa('registro')}
            disabled={!podeAvancarParaRegistro}
          >
            Avançar para registro
          </Button>
        </div>
        <div
            style={{
              textAlign: 'center',
              marginTop: '30px',
              padding: '10px 0',
              fontSize: '12px',
              color: '#888',
              borderTop: '1px solid #eee',
            }}
          >
            &copy; 2025 Meu Plantão OMED. Todos os direitos reservados.
        </div>
      </div>
    );
  }

  return (
    <div className="registro-container">
      <div className="header-box">
        <h1>Registro de Plantão</h1>
        {/* Botão Voltar no topo para conveniência */}
        <Button
            onClick={voltarParaInicio}
            variant="outline"
            className="absolute top-4 right-4" // Tailwind classes for positioning
        >
            Voltar ao Início
        </Button>
      </div>

      <div className="registro-info">
        <p>
          <strong>Plantonista:</strong> {nomePlantonista}
        </p>
        <p>
          <strong>Tipo de plantão:</strong>{' '}
          {tipoPlantao === 'PA' ? 'Pronto Atendimento' : 'Líder'}
        </p>
        <p>
          <strong>Período:</strong> {dataInicioPlantao}{' '}
          {tipoPlantao === 'PA' ? `às ${horaInicioPlantao}` : '09:00'} às{' '}
          {dataFimPlantao}{' '}
          {tipoPlantao === 'PA' ? `${horaFimPlantao}` : '17:00'}
        </p>
      </div>

      <div className="registro-inputs">
        <label htmlFor="nome-paciente">Nome do paciente</label>
        <Input
          id="nome-paciente"
          value={nomePaciente}
          onChange={(e) => setNomePaciente(e.target.value)}
        />

        <label>Tipo de atendimento</label>
        <label className="checkbox-linha">
          <Checkbox checked={inicial} onCheckedChange={setInicial} />{' '}
          Atendimento Inicial
        </label>
        <label className="checkbox-linha">
          <Checkbox checked={retorno} onCheckedChange={setRetorno} /> Retorno
        </label>
        <label className="checkbox-linha">
          <Checkbox
            checked={reavaliacao}
            onCheckedChange={(v) => {
              setReavaliacao(v);
              if (v) setDesfecho(false);
            }}
          />{' '}
          Reavaliação de outro médico
        </label>
        <label className="checkbox-linha">
          <Checkbox
            checked={desfecho}
            onCheckedChange={(v) => {
              setDesfecho(v);
              if (v) setReavaliacao(false);
            }}
          />{' '}
          Desfecho (alta/internação)
        </label>

        <label htmlFor="observacoes">Observações</label>
        <Textarea
          id="observacoes"
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          className="textarea-registro"
        />

        <Button onClick={adicionarPaciente} className="botao-grande">
          {editIndex !== null ? 'Atualizar' : 'Adicionar paciente'}
        </Button>

        {pacientes.length > 0 && (
          <div className="pacientes-list">
            <h2>Pacientes Registrados</h2>
            {pacientes.map((p, index) => (
              <Card key={index} className="paciente-card">
                <CardContent
                  className="paciente-card-content"
                  style={{ position: 'relative' }}
                >
                  <div>
                    <p>
                      <strong>Paciente:</strong> {p.nome}
                    </p>
                    <p>
                      <strong>Atendimento:</strong>{' '}
                      {p.inicial ? 'Inicial ' : ''}
                      {p.retorno ? 'Retorno ' : ''}
                      {p.reavaliacao ? 'Reavaliação ' : ''}
                      {p.desfecho ? 'Desfecho ' : ''}
                    </p>
                    {p.obs && (
                      <p>
                        <strong>Obs:</strong> {p.obs}
                      </p>
                    )}
                    <p>
                      <strong>Valor:</strong> R${' '}
                      {calcularValorPaciente(p).toFixed(2)}
                    </p>
                  </div>
                  {p.inicial && !p.retorno && !p.reavaliacao && !p.desfecho && (
                    <span className="incomplete-patient-indicator">❗</span>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => editarPaciente(index)}
                  >
                    Editar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <div className="botoes-registro">
        <Button
          onClick={voltarParaInicio}
          variant="outline"
          className="botao-grande"
        >
          Voltar
        </Button>
        <Button className="botao-grande" onClick={gerarPDF}>
          Gerar relatório do plantão
        </Button>
      </div>

      <div className="registro-info totais-plantao">
        <p>
          <strong>Total produtividade:</strong> R${' '}
          {totalProdutividade.toFixed(2)}
        </p>
        <p>
          <strong>Valor fixo do plantão:</strong> R$ {totalFixo.toFixed(2)}
        </p>
        <p>
          <strong>Total geral:</strong> R$ {totalGeral.toFixed(2)}
        </p>
      </div>

      {/* Footer de direitos reservados */}
      <div
        style={{
          textAlign: 'center',
          marginTop: '30px',
          padding: '10px 0',
          fontSize: '12px',
          color: '#888',
          borderTop: '1px solid #eee',
        }}
      >
        &copy; 2025 Meu Plantão OMED. Todos os direitos reservados.
      </div>
    </div>
  );
}
