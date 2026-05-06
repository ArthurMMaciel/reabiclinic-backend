const turnos = {
  segunda: [
    { start: '08:00', end: '12:00' },
    { start: '14:00', end: '16:00' },
  ],
  terca: [
    { start: '08:00', end: '12:00' },
    { start: '14:00', end: '16:00' },
  ],
  quarta: [{ start: '08:00', end: '12:00' }],
  quinta: [{ start: '14:00', end: '16:00' }],
};

const agendados = [
  { start: '2024-11-27T08:00:00-03:00', end: '2024-11-27T09:00:00-03:00' },
  { start: '2024-11-28T14:00:00-03:00', end: '2024-11-28T15:00:00-03:00' },
];

const intervalo = 60;

function horaParaMinutos(hora) {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
}

function minutosParaHora(minutos) {
  const horas = String(Math.floor(minutos / 60)).padStart(2, '0');
  const mins = String(minutos % 60).padStart(2, '0');
  return `${horas}:${mins}`;
}

function isSameDay(agendamento, dia) {
  const dataAgendamento = new Date(agendamento.start);

  const diasDaSemana = [
    'domingo',
    'segunda',
    'terca',
    'quarta',
    'quinta',
    'sexta',
    'sabado',
  ];
  return diasDaSemana[dataAgendamento.getDay()] === dia;
}

function getNextDateForDay(dia) {
  const dataHoje = new Date();
  const diaDaSemanaHoje = dataHoje.getDay();
  const diasDaSemana = [
    'domingo',
    'segunda',
    'terca',
    'quarta',
    'quinta',
    'sexta',
    'sabado',
  ];
  const diaAlvo = diasDaSemana.indexOf(dia);

  let diff = diaAlvo - diaDaSemanaHoje;
  if (diff < 0) {
    diff += 7;
  }

  const dataAlvo = new Date(dataHoje);
  dataAlvo.setDate(dataHoje.getDate() + diff);
  return dataAlvo.toISOString().split('T')[0];
}

function getWeekNumberRelativeToStart(startDate, date) {
  const start = new Date(startDate);
  const current = new Date(date);
  const diffInTime = current.getTime() - start.getTime();
  const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));
  return Math.floor(diffInDays / 7);
}

function obterHorariosDisponiveis(turnos, intervalo) {
  const horariosPorSemana = {};
  const hoje = new Date();
  const dataInicial = new Date(hoje);

  for (const [dia, periodos] of Object.entries(turnos)) {
    let dataFormatada = getNextDateForDay(dia);
    let semanaDoDia = 0;

    while (semanaDoDia < 2) {
      // Limite de semanas para verificar
      if (!horariosPorSemana[semanaDoDia]) {
        horariosPorSemana[semanaDoDia] = {};
      }

      if (!horariosPorSemana[semanaDoDia][dia]) {
        horariosPorSemana[semanaDoDia][dia] = [];
      }

      for (const periodo of periodos) {
        let inicioMinutos = horaParaMinutos(periodo.start);
        const fimMinutos = horaParaMinutos(periodo.end);

        while (inicioMinutos + intervalo <= fimMinutos) {
          const inicioSlot = minutosParaHora(inicioMinutos);
          const fimSlot = minutosParaHora(inicioMinutos + intervalo);

          const agendamentosDoDia = agendados.filter((agendado) =>
            isSameDay(agendado, dia),
          );

          const slotConflito = agendamentosDoDia.some((agendamento) => {
            const inicioAgendamento = horaParaMinutos(
              new Date(agendamento.start)
                .toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                .substring(12, 17),
            );
            const fimAgendamento = horaParaMinutos(
              new Date(agendamento.end)
                .toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                .substring(12, 17),
            );

            return (
              (inicioSlot >= minutosParaHora(inicioAgendamento) &&
                inicioSlot < minutosParaHora(fimAgendamento)) ||
              (fimSlot > minutosParaHora(inicioAgendamento) &&
                fimSlot <= minutosParaHora(fimAgendamento))
            );
          });

          if (!slotConflito) {
            horariosPorSemana[semanaDoDia][dia].push({
              data: dataFormatada,
              inicio: inicioSlot,
              fim: fimSlot,
            });
          }

          inicioMinutos += intervalo;
        }
      }

      // Atualiza para a próxima semana
      dataFormatada = new Date(dataFormatada);
      dataFormatada.setDate(dataFormatada.getDate() + 7);
      dataFormatada = dataFormatada.toISOString().split('T')[0];
      semanaDoDia++;
    }
  }

  return horariosPorSemana;
}

const retorno = obterHorariosDisponiveis(turnos, intervalo);
console.log(JSON.stringify(retorno, null, 2));
