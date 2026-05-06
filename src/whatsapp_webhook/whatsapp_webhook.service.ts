/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RedisService } from '../redis/redis.service';
import { PacienteService } from '../paciente/paciente.service';
import { google } from 'googleapis';
import { CalendarController } from '../calendar/calendar.controller';
import { Turno } from '../turno/entities/turno.entity';
import { TurnoService } from '../turno/turno.service';
import { UsuarioService } from '../usuario/usuario.service';
import { CalendarService } from '../calendar/calendar.service';

@Injectable()
export class WhatsappWebhookService {
  public carregarDatas: string;
  public dataAgendada: string;
  public nomeDigitado: string;
  public cpfDigitado: string;
  public profissionalEscolhido: string;
  constructor(
    private redisService: RedisService,
    private pacienteService: PacienteService,
    private turnoService: TurnoService,
    private usuarioService: UsuarioService,
    private readonly config: ConfigService,
  ) {}

  private whatsappBearerHeaders() {
    const token = this.config.get<string>('WHATSAPP_API_TOKEN');
    if (!token) {
      throw new Error('WHATSAPP_API_TOKEN deve estar definido no ambiente.');
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  async postWhatsapp(phone_number_id: string, data: any) {
    await axios.post(
      `https://graph.facebook.com/v13.0/${phone_number_id}/messages`,
      data,
      {
        headers: this.whatsappBearerHeaders(),
      },
    ).catch(err => console.log(err));
  }

  async getCalendarId(email, oAuth2Client) {
    const calendar = google.calendar({
      version: 'v3',
      auth: oAuth2Client,
    });
    try {
      const response = await calendar.calendarList.list();
      const targetCalendar = response.data.items.find(
        (cal) => cal.id === email,
      );
      if (targetCalendar) {
        return targetCalendar.id;
      } else {
        console.log(
          `Calendário não encontrado para ${email}. Calendários disponíveis:`,
        );
        response.data.items.forEach((cal) => console.log(cal.id));
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar lista de calendários:', error.message);
      return null;
    }
  }

  async checkNumber(phone_number_id, phoneNumber) {
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v13.0/${phone_number_id}/contacts`,
        {
          blocking: 'wait',
          contacts: [phoneNumber],
          force_check: true,
        },
        {
          headers: this.whatsappBearerHeaders(),
        },
      );

      const contact = response.data.contacts[0];
      if (contact.status === 'valid') {
        console.log(`O número ${phoneNumber} existe no WhatsApp.`);
      } else {
        console.log(`O número ${phoneNumber} não existe no WhatsApp.`);
      }
    } catch (error) {
      console.error(
        'Erro ao verificar número:',
        error.response ? error.response.data : error.message,
      );
    }
  }

  async enviarMensagemWhatsapp(
    texto: string,
    number: string,
    phone_number_id: string,
  ): Promise<string> {
    texto = texto.toLowerCase();
    // this.checkNumber(phone_number_id,adjustPhoneNumber(number));
    let data;
    const consentKey = `user:${adjustPhoneNumber(number)}:choices`;

    if (texto === 'nao_concorda') {
      data = this.createMessageData(
        number,
        `A Reabi Clinic agradece seu contato. Sempre que precisar, é só digitar um Oi. 🌟`,
      );
    } else if (texto === 'concorda') {
      // 5 horas em segundos

      await this.redisService.set(consentKey, { consentimento: true });

      data = this.createOptionsMessageData(number);
    } else {
      const primeiroContato =
        (await this.redisService.exists(consentKey)) === 0;
      console.log('primeiroContato');
      console.log(primeiroContato);
      if (primeiroContato) {
        const politicaPrivacidadeButtons = [
          { type: 'reply', title: 'Li e Concordo ✅', payload: 'concorda' },
          {
            type: 'reply',
            title: 'Li e Não Concordo ❌',
            payload: 'nao_concorda',
          },
        ];
        let texto = `Olá! Seja bem-vindo a Reabi Clinic, um espaço dedicado ao seu bem-estar e saúde! Eu estou aqui para tornar sua experiência ainda mais especial e ágil. 
        Ao utilizar este serviço, você concorda com o aviso de privacidade: https://reabiclinic.com.br/politica-de-privacidade/`;
        data = JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: adjustPhoneNumber(number),
          type: 'interactive',
          interactive: {
            type: 'button',
            body: {
              text: texto,
            },
            action: {
              buttons: politicaPrivacidadeButtons.map((button) => ({
                type: button.type,
                reply: {
                  id: button.payload,
                  title: button.title,
                },
              })),
            },
          },
        });
      } else {
        const userConsent = await this.redisService.get(consentKey);
        console.log(consentKey);
        console.log('Consentimento do usuario');
        console.log(userConsent);

        if (userConsent) {
          console.log(texto);

          if (texto === 'carregar_datas') {
            await this.verificaDataDisponivelNoCalendar(
              number,
              this.carregarDatas,
              userConsent.profissionalEscolhido,
            );
            return;
          }

          if (userConsent.opcao_desejada === '1') {
            console.log('este é seu texto: ' + texto);
            if (userConsent.nomePaciente) {
              let escolha = `user:${adjustPhoneNumber(number)}:choices`;
              let escolhaAtual = await this.redisService.get(escolha);
              let novaEscolha = {
                ...escolhaAtual,
                cpfPaciente: texto,
              };

              await this.redisService.set(escolha, novaEscolha);
              const oAuth2Client = await new CalendarService(
                this.usuarioService,
                this.config,
              ).authorize(userConsent.profissionalEscolhido);

              const calendarIds = {
                '1': 'c3191ef74d0984879f2a047abad145238a1bd92057e92d7ff36c24228835b5e7@group.calendar.google.com',
                '2': '575968f7a0b64148a7cc309542c491c835f58cca45b014344b5cd6e3b8abea1a@group.calendar.google.com',
                '3': '8cdaea2d7b28d208f36623c7c84c887aaeff6774983c9f689a51565bcda8be2e@group.calendar.google.com',
                '4': '3a656690f1f307b9d24284d10aef51a0745e339c7e92452265f955354e4699c5@group.calendar.google.com',
                '5': '1010c08b990cddd045fd03d35069f05cbdbee491cfcf28649770637b06267516@group.calendar.google.com'
              };
              let idCalendar = calendarIds[userConsent.profissionalEscolhido];
         
              if(userConsent.profissionalEscolhido === undefined) {
                idCalendar = 'adrianosilvaparola@gmail.com'
              }

              const calendarId = await this.getCalendarId(
                idCalendar,
                oAuth2Client,
              );
              // const partes = texto.split(' ');

              // // Extrair a data e a hora
              const dataInicial = userConsent.dataEscolhida[0];
              const horaInicial = userConsent.horarioEscolhido;

              const horaIncrementada = incrementHour(
                userConsent.horarioEscolhido,
              );

              const event = {
                summary: `${userConsent.nomePaciente}`,
                description: 'Avaliação',
                start: {
                  dateTime: `${dataInicial}T${horaInicial}:00`,
                  timeZone: 'America/Sao_Paulo',
                },
                end: {
                  dateTime: `${dataInicial}T${horaIncrementada}:00`,
                  timeZone: 'America/Sao_Paulo',
                },
                reminders: {
                  useDefault: false,
                  overrides: [
                    { method: 'email', minutes: 60 },
                    { method: 'popup', minutes: 10 },
                  ],
                },
                recurrence: [],
                colorId: '3',
              };

              const calendar = google.calendar({
                version: 'v3',
                auth: oAuth2Client,
              });

              
              await calendar.events.insert({
                calendarId: calendarId,
                requestBody: event,
              }).catch(err => console.log(err));

              let agendamentoTexto = `Agendamento confirmado: ${dataInicial
                .split(' ')[0]
                .split('-')
                .reverse()
                .join('-')} às ${horaInicial}hrs
              `;

              
              await this.postWhatsapp(phone_number_id, this.createMessageData(
                number,
                agendamentoTexto,
              ));
              await this.redisService.set(escolha, { consentimento: true });

              data = this.createMessageData(
                number,
                `   
                    1 - Agendar avaliação
                    2 - Agendar aula
                    3 - Cancelar aula
                    4 - Cancelar avaliação
                    5 - Nossos serviços (por especialista)
                    6 - Reposição/aula`,
              );

              // await this.redisService.set(escolha, {consetimento: true, agendado: agendamentoTexto});
            } else if (userConsent.horarioEscolhido) {
              let escolha = `user:${adjustPhoneNumber(number)}:choices`;
              let escolhaAtual = await this.redisService.get(escolha);
              let novaEscolha = {
                ...escolhaAtual,
                nomePaciente: texto,
              };
              await this.redisService.set(escolha, novaEscolha);
              data = this.createMessageData(number, `Digite o cpf do paciente`);
            } else if (
              userConsent.dataEscolhida &&
              texto.includes('horario_escolhido')
            ) {
              console.log('Aqui tem as horas');
              console.log(texto);

              let escolha = `user:${adjustPhoneNumber(number)}:choices`;
              let escolhaAtual = await this.redisService.get(escolha);
              let novaEscolha = {
                ...escolhaAtual,
                horarioEscolhido: texto.slice(-5),
              };
              await this.redisService.set(escolha, novaEscolha);

              data = this.createMessageData(
                number,
                `Digite o nome do paciente`,
              );
            } else if (
              userConsent.profissionalEscolhido &&
              texto.startsWith('data_escolhida')
            ) {
              console.log('Data escolhida');
              const dataEncontrada = texto.split('data_escolhida_');
              const diaEscolhido = dataEncontrada[1].split(' ');

              let escolha = `user:${adjustPhoneNumber(number)}:choices`;
              let escolhaAtual = await this.redisService.get(escolha);
              let novaEscolha = {
                ...escolhaAtual,
                dataEscolhida: diaEscolhido,
              };

              await this.redisService.set(escolha, novaEscolha);
              await this.verificaTurnoDisponivel(
                number,
                dataEncontrada,
                diaEscolhido,
                this.carregarDatas,
                userConsent.profissionalEscolhido,
              );
              data = this.createMessageData(
                number,
                `${dataEncontrada[1]
                  .split(' ')[0]
                  .split('-')
                  .reverse()
                  .join('-')} ${dataEncontrada[1].split(' ')[1]}`,
              );
            } else {
              const usuarioEscohido =
                await this.usuarioService.buscaUsuarioPorCodigo(texto);
              console.log(usuarioEscohido);
              data = this.createMessageData(
                number,
                `${usuarioEscohido.nomeCompleto} - ${usuarioEscohido.especialidade}`,
              );
              let escolha = `user:${adjustPhoneNumber(number)}:choices`;
              let escolhaAtual = await this.redisService.get(escolha);
              let novaEscolha = {
                ...escolhaAtual,
                profissionalEscolhido: texto,
              };

              await this.redisService.set(escolha, novaEscolha);
              await this.verificaDataDisponivelNoCalendar(
                number,
                null,
                novaEscolha.profissionalEscolhido,
              );
              return;
            }
          } else if (texto.includes('id_profissional_')) {
            await this.verificaDataDisponivelNoCalendar(
              number,
              null,
              texto.split('id_profissional_')[1],
            );
          } else if (texto === '1') {
            let escolha = `user:${adjustPhoneNumber(number)}:choices`;
            let escolhaAtual = await this.redisService.get(escolha);
            let novaEscolha = {
              ...escolhaAtual,
              opcao_desejada: '1',
            };
            await this.redisService.set(escolha, novaEscolha);
            console.log('aqui');
            let resultado;
            try {
              resultado = await this.usuarioService.listaUsuariosWhatsapp();
            } catch (err) {
              console.log(err);
              resultado = { usuarios: [] }; // Defina um valor padrão em caso de erro
            }

            console.log('profissionais');
            console.log(resultado);
            if (resultado.usuarios.length > 0) {
              let usuarios = resultado.usuarios;
              const escolhas = usuarios
                .map(
                  (usuario, index) =>
                    `${usuario.codigo}. ${usuario.nomeCompleto} - ${usuario.especialidade}`,
                )
                .join('\n');
              console.log(escolhas);
              data = JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: adjustPhoneNumber(number),
                type: 'text',
                text: {
                  body: `Escolha o profissional:\n${escolhas}`,
                },
              });
            } else {
              data = JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: adjustPhoneNumber(number),
                type: 'text',
                text: {
                  body: `Sem profissionais disponiveis
                    1 - Agendar avaliação
                    2 - Agendar aula
                    3 - Cancelar aula
                    4 - Cancelar avaliação
                    5 - Nossos serviços (por especialista)
                    6 - Reposição/aula`,
                },
              });

              await this.redisService.set(escolha, { consentimento: true });
            }
            await axios
              .post(
                `https://graph.facebook.com/v13.0/479681805227427/messages`,
                data,
                {
                  headers: this.whatsappBearerHeaders(),
                },
              )
              .catch((err) => console.log(err));
            return;
          } else if (texto === '2') {
            data = this.createMessageData(number, `2 - Agendar aula`);
          } else if (texto === '3') {
            data = this.createMessageData(number, `3 - Cancelar aula`);
          } else if (texto === '4') {
            data = this.createMessageData(number, `4 - Cancelar avaliação`);
          } else if (texto === '5') {
            data = this.createMessageData(
              number,
              `5 - Nossos serviços (por especialista)`,
            );
          } else if (texto === '6') {
            data = this.createMessageData(number, `6 - Reposição/aula`);
          } else if (texto === '7') {
            data = this.createMessageData(number, `7 - Encerrar conversa`);
            data = this.createMessageData(
              number,
              `A Reabi Clinic agradece seu contato. Sempre que precisar, é só digitar um Oi. 🌟`,
            );
          } else if (texto.startsWith('data_escolhida')) {
            if (texto.includes('horario_escolhido')) {
              data = this.createMessageData(
                number,
                `Digite o nome do paciente`,
              );
              this.dataAgendada = texto;
            } else {
              const dataEncontrada = texto.split('data_escolhida_');
              const diaEscolhido = dataEncontrada[1].split(' ');
              this.carregarDatas = null;
              this.verificaTurnoDisponivel(
                number,
                dataEncontrada,
                diaEscolhido,
                this.carregarDatas,
                this.profissionalEscolhido,
              );
              data = this.createMessageData(
                number,
                `${dataEncontrada[1]
                  .split(' ')[0]
                  .split('-')
                  .reverse()
                  .join('-')} ${dataEncontrada[1].split(' ')[1]}`,
              );
            }
          } else if (this.dataAgendada) {
            if (this.nomeDigitado === undefined) {
              this.nomeDigitado = texto;
            }
            if (this.nomeDigitado) {
              data = this.createMessageData(number, `Digite o cpf do paciente`);
              if (this.cpfDigitado) {
                texto = this.dataAgendada;
                const oAuth2Client = await new CalendarService(
                  this.usuarioService,
                  this.config,
                ).authorize(this.profissionalEscolhido);

                const calendarIds = {
                  '1': 'c3191ef74d0984879f2a047abad145238a1bd92057e92d7ff36c24228835b5e7@group.calendar.google.com',
                  '2': '575968f7a0b64148a7cc309542c491c835f58cca45b014344b5cd6e3b8abea1a@group.calendar.google.com',
                  '3': '8cdaea2d7b28d208f36623c7c84c887aaeff6774983c9f689a51565bcda8be2e@group.calendar.google.com',
                  '4': '3a656690f1f307b9d24284d10aef51a0745e339c7e92452265f955354e4699c5@group.calendar.google.com',
                  '5': '1010c08b990cddd045fd03d35069f05cbdbee491cfcf28649770637b06267516@group.calendar.google.com'
                };
                let idCalendar = calendarIds[userConsent.profissionalEscolhido];
           
                if(userConsent.profissionalEscolhido === undefined) {
                  idCalendar = 'adrianosilvaparola@gmail.com'
                }

                const calendarId = await this.getCalendarId(
                  idCalendar,
                  oAuth2Client,
                );
                const partes = texto.split(' ');

                // Extrair a data e a hora
                const dataInicial = partes[0].split(',')[1];
                const horaInicial = texto.slice(-5);
                const horaIncrementada = incrementHour(horaInicial);

                const event = {
                  summary: `${this.nomeDigitado}`,
                  description: 'Avaliação',
                  start: {
                    dateTime: `${dataInicial}T${horaInicial}:00`,
                    timeZone: 'America/Sao_Paulo',
                  },
                  end: {
                    dateTime: `${dataInicial}T${horaIncrementada}:00`,
                    timeZone: 'America/Sao_Paulo',
                  },
                  reminders: {
                    useDefault: false,
                    overrides: [
                      { method: 'email', minutes: 60 },
                      { method: 'popup', minutes: 10 },
                    ],
                  },
                  recurrence: [],
                  colorId: '3',
                };

                const calendar = google.calendar({
                  version: 'v3',
                  auth: oAuth2Client,
                });
                await calendar.events.insert({
                  calendarId: calendarId,
                  requestBody: event,
                });

                data = this.createMessageData(
                  number,
                  `Agendado para o dia: ${dataInicial
                    .split(' ')[0]
                    .split('-')
                    .reverse()
                    .join('-')} às ${horaInicial}`,
                );
                this.nomeDigitado = undefined;
                this.cpfDigitado = undefined;
                // this.dataAgendada = undefined
                // this.nomeDigitado = undefined
                // this.cpfDigitado = undefined
              } else {
                this.cpfDigitado = texto;
              }
            }
          } else {
            data = this.createMessageData(
              number,
              `Resposta invalida. Por Favor digite apenas o número da opção desejada 
            1 - Agendar avaliação
            2 - Agendar aula
            3 - Cancelar aula
            4 - Cancelar avaliação
            5 - Nossos serviços (por especialista)
            6 - Reposição/aula
            7 - Encerrar conversa
          `,
            );
          }
        }
      }
    }
    try {
      await this.postWhatsapp(phone_number_id, data);
      return data;
    } catch (error) {
      console.error('Erro ao enviar mensagem para o WhatsApp:', error);
    }
  }

  private createMessageData(number: string, body: string) {
    return JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: adjustPhoneNumber(number),
      type: 'text',
      text: {
        preview_url: false,
        body: body,
      },
    });
  }

  private createOptionsMessageData(number: string) {
    return JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: adjustPhoneNumber(number),
      type: 'text',
      text: {
        preview_url: false,
        body: `Digite o número da opção desejada: 
            1 - Agendar avaliação
            2 - Agendar aula
            3 - Cancelar aula
            4 - Cancelar avaliação
            5 - Nossos serviços (por especialista)
            6 - Reposição/aula
            `,
      },
    });
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  retornaDiaSemana(date) {
    const daysOfWeek = [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado',
    ];

    const dayOfWeekString = daysOfWeek[date.getDay()];
    return dayOfWeekString;
  }

  getNextDayOfWeek(targetDay) {
    const daysOfWeek = [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado',
    ];
    // Verifica se o dia fornecido é válido
    const targetIndex = daysOfWeek.indexOf(targetDay);
    if (targetIndex === -1) {
      throw new Error(
        'Dia da semana inválido. Utilize: domingo, segunda, terça, quarta, quinta, sexta ou sábado.',
      );
    }

    const hoje = new Date();
    const hojeIndex = hoje.getDay();

    // Calcula os dias restantes até o próximo dia desejado
    const diasParaProximoDia = (targetIndex - hojeIndex + 7) % 7 || 7;

    // Calcula a data da próxima ocorrência do dia desejado
    const proximoDia = new Date(hoje);
    proximoDia.setDate(hoje.getDate() + diasParaProximoDia);

    return proximoDia;
  }
  pegarProximoDiaTrabalho(
    diasTrabalho: Set<string>,
    numDias: number,
    ultimasDatas: Date,
  ): string[] {
    const diasSemana: string[] = [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado',
    ];

    let hoje;
    if (ultimasDatas) {
      hoje = new Date(ultimasDatas);
    } else {
      hoje = new Date();
    }

    const hojeIndex = hoje.getDay();
    const diasTrabalhoArray = Array.from(diasTrabalho).map((dia) =>
      diasSemana.indexOf(dia),
    );

    const proximosDias: string[] = [];
    let diasAdicionados = 0;
    for (let i = 1; diasAdicionados < numDias; i++) {
      const diaIndex = (hojeIndex + i) % 7;
      if (diasTrabalhoArray.includes(diaIndex)) {
        proximosDias.push(diasSemana[diaIndex]);
        diasAdicionados++;
      }
    }

    return proximosDias;
  }
  async verificaDataDisponivelNoCalendar(
    number,
    ultimasDatas,
    profissionalEscolhido,
  ) {
    const oAuth2Client = await new CalendarService(
      this.usuarioService,
      this.config,
    ).authorize(profissionalEscolhido);
    const calendar = google.calendar({
      version: 'v3',
      auth: oAuth2Client,
    });

    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 40); // deve mudar isso

    const calendarIds = {
      '1': 'c3191ef74d0984879f2a047abad145238a1bd92057e92d7ff36c24228835b5e7@group.calendar.google.com',
      '2': '575968f7a0b64148a7cc309542c491c835f58cca45b014344b5cd6e3b8abea1a@group.calendar.google.com',
      '3': '8cdaea2d7b28d208f36623c7c84c887aaeff6774983c9f689a51565bcda8be2e@group.calendar.google.com',
      '4': '3a656690f1f307b9d24284d10aef51a0745e339c7e92452265f955354e4699c5@group.calendar.google.com',
      '5': '1010c08b990cddd045fd03d35069f05cbdbee491cfcf28649770637b06267516@group.calendar.google.com'
    };
    let idCalendar = calendarIds[profissionalEscolhido];

    if(profissionalEscolhido === undefined) {
      idCalendar = 'adrianosilvaparola@gmail.com'
    }

    const calendario = await calendar.freebusy.query({
      requestBody: {
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        timeZone: 'America/Sao_Paulo',
        items: [{ id: idCalendar }],
      },
    });

    console.log('Propriedade data do objeto calendario:');
    console.log(calendario.data)
    console.log('Propriedade calendars do objeto data:');
    console.log(calendario.data.calendars)
    console.log('Propriedade primary do objeto calendars:');
    console.log(calendario.data.calendars.primary)
    console.log('Propriedade busy do objeto busy:');
    console.log(calendario.data.calendars[idCalendar].busy)
    const horariosProfissional =
      await this.turnoService.findByCodigoProfissional(profissionalEscolhido);
    const agendados = calendario.data.calendars[idCalendar].busy;
    const intervalo = 60; // depende de cada caso
    let retorno;
    if (ultimasDatas) {
      retorno = obterHorariosDisponiveis(
        horariosProfissional,
        agendados,
        intervalo,
        ultimasDatas,
      );
    } else {
      retorno = obterHorariosDisponiveis(
        horariosProfissional,
        agendados,
        intervalo,
        null,
      );
    }

    const diasSemanaTrabalha: Set<string> = new Set();
    horariosProfissional.forEach((turno: Turno) => {
      diasSemanaTrabalha.add(turno.dia_semana);
    });

    let proximosDias = [];
    if (diasSemanaTrabalha.size > 0) {
      if (ultimasDatas) {
        proximosDias = this.pegarProximoDiaTrabalho(
          diasSemanaTrabalha,
          6,
          ultimasDatas,
        );
      } else {
        proximosDias = this.pegarProximoDiaTrabalho(
          diasSemanaTrabalha,
          6,
          null,
        );
      }
    } else {
      await axios.post(
        `https://graph.facebook.com/v13.0/479681805227427/messages`,
        {
          messaging_product: 'whatsapp',
          to: adjustPhoneNumber(number),
          text: { body: 'Sem horários disponiveis' },
        },
        {
          headers: this.whatsappBearerHeaders(),
        },
      );
      return;
    }
    const proximos3DiasDisponiveis = [];
    Object.keys(retorno).forEach((key) => {
      const dias = retorno[key];

      proximosDias.forEach((proximoDia) => {
        const diaFormatado = proximoDia.toString().toLocaleLowerCase();
        const diaDisponivel = dias[diaFormatado];

        if (diaDisponivel.length > 0) {
          const dataDisponivel = diaDisponivel[0].data;

          // Verifica se o dia com a mesma data já existe no array
          const jaExiste = proximos3DiasDisponiveis.some(
            (diaObj) =>
              diaObj.dia === proximoDia && diaObj.data === dataDisponivel,
          );
          if (!jaExiste) {
            proximos3DiasDisponiveis.push({
              dia: proximoDia,
              data: dataDisponivel,
            });
          }
        }
      });
    });

    let primeiroDiaDisponivel;
    let segundoDiaDisponivel;
    let terceiroDiaDisponivel;

    // Verifica se há pelo menos 1 item
    if (proximos3DiasDisponiveis.length > 0) {
      primeiroDiaDisponivel = `${proximos3DiasDisponiveis[0].data} ${proximos3DiasDisponiveis[0].dia}`;
    }

    // Verifica se há pelo menos 2 itens
    if (proximos3DiasDisponiveis.length > 1) {
      segundoDiaDisponivel = `${proximos3DiasDisponiveis[1].data} ${proximos3DiasDisponiveis[1].dia}`;
    }

    // Verifica se há pelo menos 3 itens
    if (proximos3DiasDisponiveis.length > 2) {
      terceiroDiaDisponivel = `${proximos3DiasDisponiveis[2].data} ${proximos3DiasDisponiveis[2].dia}`;
    }

    // Atualiza a data, considerando o número de itens disponíveis
    if (proximos3DiasDisponiveis.length > 2) {
      this.carregarDatas = proximos3DiasDisponiveis[2].data + 'T03:00:00-03:00';
    } else if (proximos3DiasDisponiveis.length > 1) {
      this.carregarDatas = proximos3DiasDisponiveis[1].data + 'T03:00:00-03:00';
    } else if (proximos3DiasDisponiveis.length > 0) {
      this.carregarDatas = proximos3DiasDisponiveis[0].data + 'T03:00:00-03:00';
    } else {
      console.log('Nenhuma data disponível.');
      await axios.post(
        `https://graph.facebook.com/v13.0/479681805227427/messages`,
        {
          messaging_product: 'whatsapp',
          to: adjustPhoneNumber(number),
          text: { body: 'Sem horários disponiveis' },
        },
        {
          headers: this.whatsappBearerHeaders(),
        },
      );
    }

    let buttons = [];
    if (primeiroDiaDisponivel) {
      buttons.push({
        type: 'reply',
        reply: {
          id: `data_escolhida_${primeiroDiaDisponivel}`,
          title: `${primeiroDiaDisponivel
            .split(' ')[0]
            .split('-')
            .reverse()
            .join('-')} ${primeiroDiaDisponivel.split(' ')[1]}`,
        },
      });
    }
    if (segundoDiaDisponivel) {
      buttons.push({
        type: 'reply',
        reply: {
          id: `data_escolhida_${segundoDiaDisponivel}`,
          title: `${segundoDiaDisponivel
            .split(' ')[0]
            .split('-')
            .reverse()
            .join('-')} ${segundoDiaDisponivel.split(' ')[1]}`,
        },
      });
    }
    if (terceiroDiaDisponivel) {
      buttons.push({
        type: 'reply',
        reply: {
          id: `data_escolhida_${terceiroDiaDisponivel}`,
          title: `${terceiroDiaDisponivel
            .split(' ')[0]
            .split('-')
            .reverse()
            .join('-')} ${terceiroDiaDisponivel.split(' ')[1]}`,
        },
      });
    }
    let data;
    if (buttons.length > 0) {
      data = JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: adjustPhoneNumber(number),
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: 'Escolha a data disponivel no calendario',
          },
          action: {
            buttons: buttons,
          },
        },
      });
      await axios.post(
        `https://graph.facebook.com/v13.0/479681805227427/messages`,
        data,
        {
          headers: this.whatsappBearerHeaders(),
        },
      );
    } else {
      console.log('Nenhuma data disponível.');
    }

    if (proximos3DiasDisponiveis.length > 2) {
      data = JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: adjustPhoneNumber(number),
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: 'Click no botão abaixo para próximas datas disponíveis.',
          },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: {
                  id: 'carregar_datas',
                  title: '➕',
                },
              },
            ],
          },
        },
      });

      await axios.post(
        `https://graph.facebook.com/v13.0/479681805227427/messages`,
        data,
        {
          headers: this.whatsappBearerHeaders(),
        },
      );
    }
  }

  async enviarMensagem(number, buttons) {
    const data = JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: adjustPhoneNumber(number),
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: '.', // Texto do corpo
        },
        action: {
          buttons: buttons,
        },
      },
    });
    await axios.post(
      'https://graph.facebook.com/v13.0/479681805227427/messages',
      data,
      {
        headers: this.whatsappBearerHeaders(),
      },
    );
  }

  async verificaTurnoDisponivel(
    number,
    data_escolhida,
    dia_semana,
    ultimasDatas,
    profissionalEscolhido,
  ) {
    const oAuth2Client = await new CalendarService(
      this.usuarioService,
      this.config,
    ).authorize(profissionalEscolhido);
    const calendar = google.calendar({
      version: 'v3',
      auth: oAuth2Client,
    });

    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 40);

    const calendarIds = {
      '1': 'c3191ef74d0984879f2a047abad145238a1bd92057e92d7ff36c24228835b5e7@group.calendar.google.com',
      '2': '575968f7a0b64148a7cc309542c491c835f58cca45b014344b5cd6e3b8abea1a@group.calendar.google.com',
      '3': '8cdaea2d7b28d208f36623c7c84c887aaeff6774983c9f689a51565bcda8be2e@group.calendar.google.com',
      '4': '3a656690f1f307b9d24284d10aef51a0745e339c7e92452265f955354e4699c5@group.calendar.google.com',
      '5': '1010c08b990cddd045fd03d35069f05cbdbee491cfcf28649770637b06267516@group.calendar.google.com'
    };
    let idCalendar = calendarIds[profissionalEscolhido];

    if(profissionalEscolhido === undefined) {
      idCalendar = 'adrianosilvaparola@gmail.com'
    }


    const calendario = await calendar.freebusy.query({
      requestBody: {
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        timeZone: 'America/Sao_Paulo',
        items: [{ id: idCalendar }],
      },
    });

    console.log('Propriedade data do objeto calendario:');
    console.log(calendario.data)
    console.log('Propriedade calendars do objeto data:');
    console.log(calendario.data.calendars)
    console.log('Propriedade primary do objeto calendars:');
    console.log(calendario.data.calendars.primary)
    console.log('Propriedade busy do objeto busy:');
    console.log(calendario.data.calendars[idCalendar].busy)

    const horariosProfissional = await this.turnoService.findByCodigoProfissional(profissionalEscolhido);

    console.log('Turnos do profissionall')
    console.log(horariosProfissional)
    const agendados = calendario.data.calendars[idCalendar].busy;
    const intervalo = 60; // depende de cada caso

    let retorno;
    if (ultimasDatas) {
      retorno = obterHorariosDisponiveisTurnos(
        horariosProfissional,
        agendados,
        intervalo,
        data_escolhida,
        ultimasDatas,
      );
    } else {
      retorno = obterHorariosDisponiveisTurnos(
        horariosProfissional,
        agendados,
        intervalo,
        data_escolhida,
        null,
      );
    }

    const horariosDisponiveis = retorno[dia_semana[1]];
    while (horariosDisponiveis.length > 0) {
      const buttons = [];
      for (let i = 0; i < 3 && horariosDisponiveis.length > 0; i++) {
        const horario = horariosDisponiveis.shift(); // Remove o primeiro elemento
        buttons.push({
          type: 'reply',
          reply: {
            id: `data_escolhida_${data_escolhida}_horario_escolhido_${horario.inicio}`,
            title: `${horario.inicio}`,
          },
        });
      }

      await this.enviarMensagem(number, buttons);
    }
  }

  stringParaMinutos(tempo) {
    const [horas, minutos] = tempo.split(':').map(Number);
    return horas * 60 + minutos;
  }

  minutosParaString(minutos) {
    const horas = String(Math.floor(minutos / 60)).padStart(2, '0');
    const mins = String(minutos % 60).padStart(2, '0');
    return `${horas}:${mins}`;
  }
}

const adjustPhoneNumber = (phoneNumber: string): string => {
  if (phoneNumber === '554499331719' || phoneNumber === '554497001742') {
    return phoneNumber;
  }
  const regex = /^(55\d{2})(\d{4,5})(\d{4})$/;
  return phoneNumber.replace(regex, '$19$2$3');
};

function horaParaMinutos(hora) {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
}

function minutosParaHora(minutos) {
  const horas = String(Math.floor(minutos / 60)).padStart(2, '0');
  const mins = String(minutos % 60).padStart(2, '0');
  return `${horas}:${mins}`;
}

function isSameDay2(agendamento, dia, dataFormatada) {
  const dataAgendamento = new Date(agendamento.start);
  const diasDaSemana = [
    'domingo',
    'segunda',
    'terça',
    'quarta',
    'quinta',
    'sexta',
    'sabado',
  ];
  return diasDaSemana[dataAgendamento.getDay()] === dia;
}

function isSameDay(agendamento, dataFormatada) {
  const dataAgendamento = new Date(agendamento.start);
  // Converte dataFormatada para um objeto Date
  const dataFormatadaDate = new Date(dataFormatada + 'T00:00:00');
  // Compara ano, mês e dia
  return (
    dataAgendamento.getFullYear() === dataFormatadaDate.getFullYear() &&
    dataAgendamento.getMonth() === dataFormatadaDate.getMonth() &&
    dataAgendamento.getDate() === dataFormatadaDate.getDate()
  );
}
function getNextDateForDay(dia, ultimasDatas) {
  let dataHoje = new Date();
  if (ultimasDatas) {
    dataHoje = new Date(ultimasDatas);
  } else {
    dataHoje = new Date();
  }

  const diaDaSemanaHoje = dataHoje.getDay();
  const diasDaSemana = [
    'domingo',
    'segunda',
    'terça',
    'quarta',
    'quinta',
    'sexta',
    'sabado',
  ];
  const diaAlvo = diasDaSemana.indexOf(dia);

  // Calcular a diferença em dias até o próximo "dia" alvo
  let diff = diaAlvo - diaDaSemanaHoje;
  if (diff <= 0) {
    diff += 7;
  }

  const dataAlvo = new Date(dataHoje);
  dataAlvo.setDate(dataHoje.getDate() + diff);
  return dataAlvo.toISOString().split('T')[0];
}

function obterHorariosDisponiveisTurnos(
  turnos,
  agendados,
  intervalo,
  data_escolhida,
  ultimasDatas,
) {
  const horarios = {};

  let diaEscolhido = data_escolhida[1].split(' ');
  // Organiza os turnos por dia
  turnos.forEach((horario) => {
    const dia = horario.dia_semana.toLowerCase();
    const turno = {
      start: horario.hora_inicial,
      end: horario.hora_final,
    };

    if (!horarios[dia]) {
      horarios[dia] = [];
    }
    horarios[dia].push(turno);
  });

  // Lista de dias da semana
  const diasDaSemana = [
    'domingo',
    'segunda',
    'terca',
    'quarta',
    'quinta',
    'sexta',
    'sabado',
  ];

  // Formatar horários disponíveis para cada dia da semana
  for (const [dia_semana, periodos] of Object.entries(horarios)) {
    horarios[dia_semana] = [];
    let dataFormatada;

    if (ultimasDatas) {
      dataFormatada = getNextDateForDay(dia_semana, ultimasDatas);
    } else {
      dataFormatada = getNextDateForDay(dia_semana, null);
    }

    if (Array.isArray(periodos)) {
      for (const periodo of periodos) {
        let inicioMinutos = horaParaMinutos(periodo.start);
        const fimMinutos = horaParaMinutos(periodo.end);
        while (inicioMinutos + intervalo <= fimMinutos) {
          const inicioSlot = minutosParaHora(inicioMinutos);
          const fimSlot = minutosParaHora(inicioMinutos + intervalo);

          // const agendamentosDoDia = agendados.filter((agendado) =>
          //   isSameDay(agendado, dataFormatada),
          // );
          const slotConflito = agendados.some((agendamento) => {
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

            let diaAgendado = new Date(agendamento.start)
              .toISOString()
              .split('T')[0];
            // if(diaAgendado === '2024-12-10') {
            //   debugger
            // }
            return (
              ((inicioSlot >= minutosParaHora(inicioAgendamento) &&
                inicioSlot < minutosParaHora(fimAgendamento)) ||
                (fimSlot > minutosParaHora(inicioAgendamento) &&
                  fimSlot <= minutosParaHora(fimAgendamento))) &&
              diaAgendado === diaEscolhido[0]
            );
          });

          // Se houver conflito, não adiciona o slot, caso contrário, adiciona ao horário
          // if(dia_semana === 'terça') {
          //   debugger
          // }
          if (!slotConflito) {
            horarios[dia_semana].push({
              data: dataFormatada,
              inicio: inicioSlot,
              fim: fimSlot,
            });
          } else {
            console.log(horarios[dia_semana])
            console.log('Connflito')
          }
          // Avança o slot
          inicioMinutos += intervalo;
        }
      }
    } else {
      console.error(`'${dia_semana}' não tem um array de períodos válido`);
    }
  }

  return horarios;
}

function obterHorariosDisponiveis(turnos, agendados, intervalo, ultimasDatas) {
  const horarios = {};
  const horariosPorSemana = {};
  // Organiza os turnos por dia
  turnos.forEach((horario) => {
    const dia = horario.dia_semana.toLowerCase();
    const turno = {
      start: horario.hora_inicial,
      end: horario.hora_final,
    };

    if (!horarios[dia]) {
      horarios[dia] = [];
    }
    horarios[dia].push(turno);
  });

  // Formatar horários disponíveis para cada dia da semana
  for (const [dia_semana, periodos] of Object.entries(horarios)) {
    horarios[dia_semana] = [];

    let dataFormatada;
    if (ultimasDatas) {
      dataFormatada = getNextDateForDay(dia_semana, ultimasDatas);
    } else {
      dataFormatada = getNextDateForDay(dia_semana, null);
    }
    let semanaDoDia = 0;

    if (Array.isArray(periodos)) {
      while (semanaDoDia < 6) {
        // Limite de semanas para verificar
        if (!horariosPorSemana[semanaDoDia]) {
          horariosPorSemana[semanaDoDia] = {};
        }

        if (!horariosPorSemana[semanaDoDia][dia_semana]) {
          horariosPorSemana[semanaDoDia][dia_semana] = [];
        }

        for (const periodo of periodos) {
          let inicioMinutos = horaParaMinutos(periodo.start);
          const fimMinutos = horaParaMinutos(periodo.end);
          if (dataFormatada === '2025-01-13') {
            //  debugger
          }
          while (inicioMinutos + intervalo <= fimMinutos) {
            const inicioSlot = minutosParaHora(inicioMinutos);
            const fimSlot = minutosParaHora(inicioMinutos + intervalo);
            // Filtra os agendamentos para o dia
            const agendamentosDoDia = agendados.filter((agendado) =>
              isSameDay(agendado, dataFormatada),
            );
            // Verifica conflitos de horário
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
              if (dataFormatada === '2025-01-13') {
                //   debugger
              }
              return (
                (inicioSlot >= minutosParaHora(inicioAgendamento) &&
                  inicioSlot < minutosParaHora(fimAgendamento)) ||
                (fimSlot > minutosParaHora(inicioAgendamento) &&
                  fimSlot <= minutosParaHora(fimAgendamento))
              );
            });

            // Se houver conflito, não adiciona o slot, caso contrário, adiciona ao horário
            if (!slotConflito) {
              horariosPorSemana[semanaDoDia][dia_semana].push({
                data: dataFormatada,
                inicio: inicioSlot,
                fim: fimSlot,
              });
            }
            // Avança o slot
            inicioMinutos += intervalo;
          }
        }
        let dataIncremento = new Date(dataFormatada);
        dataIncremento.setDate(dataIncremento.getDate() + 7);
        dataFormatada = dataIncremento.toISOString().split('T')[0];
        semanaDoDia++;
      }
      // dataFormatada = incrementDate(dataFormatada);
    } else {
      console.error(`'${dia_semana}' não tem um array de períodos válido`);
    }
  }
  return horariosPorSemana;
}
function incrementHour(hora) {
  let [hours, minutes] = hora.split(':');
  hours = parseInt(hours) + 1;
  if (hours < 10) hours = '0' + hours; // Para manter o formato HH:MM
  return `${hours}:${minutes}`;
}
function incrementDate(date) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + 7);
  return newDate.toISOString().split('T')[0];
}

function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, ''); // Remove qualquer caractere que não seja dígito

  if (cpf.length !== 11) return false; // Verifica se o CPF tem 11 dígitos
  if (/^(.)\1*$/.test(cpf)) return false; // Verifica se todos os dígitos são iguais

  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }

  resto = (soma * 10) % 11;

  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }

  resto = (soma * 10) % 11;

  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}
