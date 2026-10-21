// Dados de exemplo do protótipo. Ficam salvos no navegador (localStorage)
// para que as alterações feitas na interface persistam entre recargas.
// O modelo segue o sistema antigo (sumos.devmais.com); clientes e descrições são fictícios.
const SEED_VERSION = 7;

const REAL_TECHS = ['João Matheus', 'Edvan Lira', 'Tarcísio Filho', 'Italo Hewrison', 'Rafael Alves', 'Gabriel Oliveira', 'Maisa Both', 'Daniel Roberto'];
const SERVICE_TYPES = ['Informática', 'Rede', 'Internet', 'Sistema', 'Telefonia', 'CFTV', 'Áudio e Vídeo', 'Preventiva', 'Outros'];

// Status reais da OS. "Fechadas" = Resolvido, Finalizada e Cancelado.
const STATUS = {
  aberto:      { label: 'Aberto',             cls: 'b-brand',  color: '#007AFF' },
  atendimento: { label: 'Em atendimento',     cls: 'b-accent', color: '#15C0D8' },
  aguardando:  { label: 'Aguardando cliente', cls: 'b-warn',   color: '#FF9500' },
  resolvido:   { label: 'Resolvido',          cls: 'b-ok',     color: '#34C759' },
  finalizada:  { label: 'Finalizada',         cls: 'b-muted',  color: '#6E6E73' },
  cancelado:   { label: 'Cancelado',          cls: 'b-danger', color: '#FF3B30' },
};
const CLOSED = ['resolvido', 'finalizada', 'cancelado'];
const FLOW = ['aberto', 'atendimento', 'aguardando', 'resolvido', 'finalizada'];
// Urgência e prazo (SLA) do formulário de Nova OS
const URG = {
  normal:  { label: 'Normal',  sla: '72h', hours: 72, color: '#34C759' },
  alta:    { label: 'Alta',    sla: '24h', hours: 24, color: '#FF9500' },
  critica: { label: 'Crítica', sla: '4h',  hours: 4,  color: '#FF3B30' },
};

function buildSeed() {
  const day = 864e5;
  const now = new Date();
  const d = (offsetDays, h = 10, m = 0) => {
    const x = new Date(now.getTime() + offsetDays * day);
    x.setHours(h, m, 0, 0);
    return x.toISOString();
  };

  const clients = [
    { id: 1, name: 'Padaria Pão Dourado', doc: '11.222.333/0001-01', address: 'Av. Santos Dumont, 1200 - Aldeota, Fortaleza - CE', contact: 'Marcos (gerente)', phone: '(85) 98811-1001', email: 'contato@paodourado.com.br', city: 'Fortaleza, CE', since: d(-420) },
    { id: 2, name: 'Clínica Bem Estar', doc: '22.333.444/0001-02', address: 'R. Barbosa de Freitas, 455 - Meireles, Fortaleza - CE', contact: 'Dra. Paula', phone: '(85) 98822-2002', email: 'adm@clinicabemestar.com.br', city: 'Fortaleza, CE', since: d(-380) },
    { id: 3, name: 'Lima & Associados Advocacia', doc: '33.444.555/0001-03', address: 'Av. Dom Luís, 880 - Meireles, Fortaleza - CE', contact: 'Renata Lima', phone: '(85) 98833-3003', email: 'ti@limaadv.com.br', city: 'Fortaleza, CE', since: d(-300) },
    { id: 4, name: 'Restaurante Sabor da Terra', doc: '44.555.666/0001-04', address: 'R. Tibúrcio Cavalcante, 2100 - Dionísio Torres, Fortaleza - CE', contact: 'Chef Rodrigo', phone: '(85) 98844-4004', email: 'gerencia@sabordaterra.com.br', city: 'Fortaleza, CE', since: d(-260) },
    { id: 5, name: 'Mercado Bom Preço', doc: '55.666.777/0001-05', address: 'Av. Bezerra de Menezes, 3300 - São Gerardo, Fortaleza - CE', contact: 'Sr. Antônio', phone: '(85) 98855-5005', email: 'compras@bompreco.com.br', city: 'Fortaleza, CE', since: d(-210) },
    { id: 6, name: 'Hotel Beira Mar', doc: '66.777.888/0001-06', address: 'Av. Beira Mar, 4000 - Mucuripe, Fortaleza - CE', contact: 'Recepção / Carla', phone: '(85) 98866-6006', email: 'ti@hotelbeiramar.com.br', city: 'Fortaleza, CE', since: d(-180) },
    { id: 7, name: 'Academia Corpo Ativo', doc: '77.888.999/0001-07', address: 'R. Pereira Filgueiras, 900 - Centro, Fortaleza - CE', contact: 'Bruno', phone: '(85) 98877-7007', email: 'bruno@corpoativo.com.br', city: 'Fortaleza, CE', since: d(-120) },
    { id: 8, name: 'Farmácia Saúde Já', doc: '88.999.000/0001-08', address: 'Av. Washington Soares, 1500 - Edson Queiroz, Fortaleza - CE', contact: 'Juliana (farmacêutica)', phone: '(85) 98888-8008', email: 'loja1@saudeja.com.br', city: 'Fortaleza, CE', since: d(-90) },
    { id: 9, name: 'Colégio Novo Saber', doc: '99.000.111/0001-09', address: 'R. Monsenhor Bruno, 1800 - Aldeota, Fortaleza - CE', contact: 'Coord. Helena', phone: '(85) 98899-9009', email: 'secretaria@novosaber.com.br', city: 'Fortaleza, CE', since: d(-60) },
    { id: 10, name: 'Loja Vila Moda', doc: '10.111.222/0001-10', address: 'Shopping Iguatemi, loja 210 - Edson Queiroz, Fortaleza - CE', contact: 'Fernanda', phone: '(85) 98800-0010', email: 'vilamoda@email.com', city: 'Fortaleza, CE', since: d(-20) },
  ];
  const techs = REAL_TECHS.slice();

  // [cliente, descrição, tipo, modalidade, urgência, status, técnico (-1 = sem), aberta (dias), agendada (dias | null), hora, computador, solicitante]
  const raw = [
    [1, 'Impressora fiscal do caixa 2 não imprime cupom', 'Informática', 'Presencial', 'alta', 'aberto', 0, -1, 0, [8, 0], 'PDV Caixa 2', 'Marcos'],
    [2, 'Configurar VPN no notebook da recepção', 'Rede', 'Remoto', 'normal', 'aberto', 7, -2, 1, [9, 30], 'Notebook Recepção', 'Dra. Paula'],
    [3, 'Backup do servidor falhando há 3 dias', 'Sistema', 'Remoto', 'critica', 'atendimento', 7, -1, 0, [10, 0], 'Servidor LIMA-SRV01', 'Renata Lima'],
    [4, 'Caixas de som do salão sem áudio', 'Áudio e Vídeo', 'Presencial', 'normal', 'aberto', 1, -3, 1, [14, 0], '—', 'Chef Rodrigo'],
    [5, 'Câmera do estacionamento sem imagem no DVR', 'CFTV', 'Presencial', 'alta', 'aguardando', 3, -4, -1, [15, 30], 'DVR 16 canais', 'Sr. Antônio'],
    [6, 'Wi-Fi caindo no 3º andar', 'Rede', 'Presencial', 'alta', 'aberto', 4, -2, 2, [8, 0], 'Access Point AP-3', 'Carla'],
    [7, 'Instalar sistema de catraca no PC da recepção', 'Sistema', 'Presencial', 'normal', 'aberto', -1, 0, null, null, 'PC Recepção', 'Bruno'],
    [8, 'Link de internet lento na loja', 'Internet', 'Remoto', 'alta', 'atendimento', 2, -1, 0, [11, 0], 'Roteador principal', 'Juliana'],
    [9, 'Preventiva mensal do laboratório de informática', 'Preventiva', 'Presencial', 'normal', 'aberto', 5, -5, 3, [8, 0], '20 PCs do laboratório', 'Coord. Helena'],
    [10, 'Criar e-mail para nova funcionária', 'Sistema', 'Remoto', 'normal', 'resolvido', 6, -3, -2, [10, 0], '—', 'Fernanda'],
    [1, 'Trocar HD por SSD no PC do escritório', 'Informática', 'Presencial', 'normal', 'aberto', 0, -6, 4, [9, 30], 'PC Escritório', 'Marcos'],
    [2, 'Ramal 204 sem sinal', 'Telefonia', 'Presencial', 'alta', 'aberto', -1, -1, null, null, 'Ramal 204', 'Dra. Paula'],
    [3, 'Atualizar firmware do roteador (falha de segurança)', 'Rede', 'Remoto', 'critica', 'aberto', 7, 0, 1, [8, 0], 'Roteador MikroTik', 'Renata Lima'],
    [4, 'Sistema do PDV travando ao fechar a conta', 'Sistema', 'Remoto', 'alta', 'aguardando', 3, -3, null, null, 'PDV Salão', 'Chef Rodrigo'],
    [5, 'Mudar ponto de rede do financeiro', 'Rede', 'Presencial', 'normal', 'finalizada', 1, -9, -6, [14, 0], '—', 'Sr. Antônio'],
    [6, 'TV do menu digital sem sinal', 'Áudio e Vídeo', 'Presencial', 'normal', 'aberto', 4, -2, 1, [15, 30], 'TV Lobby', 'Carla'],
    [7, 'Notebook do professor não liga', 'Informática', 'Presencial', 'alta', 'aberto', 2, -4, -1, [10, 0], 'Notebook Dell', 'Bruno'],
    [8, 'Configurar impressora de etiquetas Zebra', 'Informática', 'Remoto', 'normal', 'resolvido', 5, -5, -3, [11, 0], 'PC Estoque', 'Juliana'],
    [9, 'Instalar antivírus nos PCs da secretaria', 'Sistema', 'Remoto', 'normal', 'aberto', 6, -1, 2, [14, 0], '5 PCs', 'Coord. Helena'],
    [10, 'Gravação das câmeras da loja apagando sozinha', 'CFTV', 'Presencial', 'alta', 'aberto', -1, -2, null, null, 'NVR 8 canais', 'Fernanda'],
    [1, 'Formatar PC da recepção', 'Informática', 'Presencial', 'normal', 'cancelado', 0, -12, null, null, 'PC Recepção', 'Marcos'],
    [3, 'Visita técnica de levantamento para novo escritório', 'Outros', 'Presencial', 'normal', 'aberto', 0, -1, 0, [14, 0], '—', 'Renata Lima'],
  ];
  const code = (id) => ((id * 2654435761) >>> 0).toString(16).padStart(8, '0');
  const orders = raw.map(([cli, issue, type, modality, urgency, status, techIdx, opened, sched, hm, computer, requester], i) => {
    const id = i + 1;
    const openedAt = d(opened, 8 + (i % 9), (i * 13) % 60);
    const dueAt = new Date(new Date(openedAt).getTime() + URG[urgency].hours * 36e5).toISOString();
    const scheduledAt = sched === null ? '' : d(sched, hm[0], hm[1]);
    const tech = techIdx < 0 ? '' : techs[techIdx];
    const history = [{ at: openedAt, text: 'OS aberta' + (requester ? ' a pedido de ' + requester : '') }];
    if (scheduledAt) history.push({ at: openedAt, text: 'Atendimento agendado para ' + new Date(scheduledAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) });
    if (status !== 'aberto') history.push({ at: d(Math.min(0, opened + 1), 16), text: 'Status alterado para “' + STATUS[status].label + '”' });
    return {
      id, code: code(id), clientId: cli, requester, tech, supplier: status === 'aguardando' && i % 2 ? 'B7 Soluções' : '',
      type, computer, modality, urgency, status, issue,
      openedAt, dueAt, scheduledAt, pinned: i === 2,
      // data de fechamento (usada no SLA dos relatórios); metade fecha dentro do prazo
      closedAt: CLOSED.includes(status) ? new Date(new Date(openedAt).getTime() + URG[urgency].hours * 36e5 * (i % 2 ? 0.5 : 1.4)).toISOString() : '',
      solution: CLOSED.includes(status) && status !== 'cancelado' ? 'Problema resolvido e testado com o cliente.' : '',
      timeSpent: status === 'atendimento' ? 35 : CLOSED.includes(status) ? 60 + (i % 4) * 15 : 0, timerStart: '',
      items: i % 4 === 0 ? [{ name: 'Visita técnica', kind: 'material', qty: 1, price: 120, obs: '' }] : i % 5 === 1 ? [{ name: 'SSD 480GB SATA', kind: 'compra', qty: 1, price: 290, obs: 'Cliente aprovou' }] : [],
      signature: null,
      history,
    };
  });

  // Produtos e serviços: um cadastro só (no sistema real, Estoque é a visão de saldo deste catálogo)
  const catRaw = [
    ['SSD 480GB SATA', 'Armazenamento', 'Produto', 290, 6, 2, 'A1', 'NFe 4471-2'],
    ['Memória DDR4 16GB', 'Memória', 'Produto', 340, 0, 2, 'A2', 'NFe 4471-3'],
    ['Memória DDR4 8GB', 'Memória', 'Produto', 190, 5, 2, 'A2', ''],
    ['Cabo de rede Cat6 (metro)', 'Rede', 'Produto', 6, 180, 50, 'B1', ''],
    ['Conector RJ45 (pacote 100)', 'Rede', 'Produto', 45, 1, 2, 'B1', ''],
    ['Patch cord Cat6 1,5m', 'Rede', 'Produto', 18, 14, 5, 'B2', ''],
    ['Access Point Wi-Fi 6 de teto', 'Rede', 'Produto', 1150, 1, 2, 'B3', 'NFe 5552-3'],
    ['Switch 24 portas gigabit', 'Rede', 'Produto', 1890, 2, 1, 'B4', 'NFe 6120-1'],
    ['Câmera IP Full HD', 'CFTV', 'Produto', 420, 4, 2, 'C1', 'NFe 3008-7'],
    ['Balun par (CFTV)', 'CFTV', 'Produto', 42, 0, 4, 'C2', ''],
    ['Fonte ATX 500W', 'Informática', 'Produto', 360, 3, 2, 'D1', ''],
    ['Pasta térmica Arctic MX-4', 'Insumos', 'Produto', 35, 2, 3, 'D2', ''],
    ['Bobina térmica 80mm (caixa)', 'Insumos', 'Produto', 150, 7, 3, '', ''],
    ['Abraçadeira de nylon (pct 100)', 'Insumos', 'Produto', 10, 0, 2, '', ''],
    ['Visita técnica', 'Serviços', 'Serviço', 120, 0, 0, '', ''],
    ['Formatação + backup', 'Serviços', 'Serviço', 150, 0, 0, '', ''],
    ['Hora técnica remota', 'Serviços', 'Serviço', 90, 0, 0, '', ''],
    ['Instalação de câmera', 'Serviços', 'Serviço', 180, 0, 0, '', ''],
  ];
  const catalogo = catRaw.map(([name, category, type, price, stock, min, location, nfe], i) => ({
    id: i + 1, name, image: '', category, type, price, stock, factor: 1, min, location,
    desc: nfe ? 'Código ' + nfe : '', nfe,
    moves: type === 'Produto' && stock ? [{ at: d(-20 + i, 10), type: 'entrada', qty: stock, balance: stock, origin: nfe ? 'Importação ' + nfe : 'Cadastro inicial' }] : [],
  }));

  const tx = [
    { id: 1, type: 'in',  desc: 'Contrato mensal · Lima & Associados', cat: 'Contratos', value: 1800, at: d(-3, 15), method: 'Boleto' },
    { id: 2, type: 'in',  desc: 'Contrato mensal · Hotel Beira Mar', cat: 'Contratos', value: 2400, at: d(-6, 11), method: 'Boleto' },
    { id: 3, type: 'in',  desc: 'Avulso · Mudança de ponto de rede', cat: 'Serviços', value: 350, at: d(-6, 16), method: 'Pix' },
    { id: 4, type: 'out', desc: 'Fornecedor · SSDs e memórias', cat: 'Peças', value: 980, at: d(-5, 10), method: 'Boleto' },
    { id: 5, type: 'out', desc: 'Aluguel do escritório', cat: 'Fixas', value: 1800, at: d(-9, 9), method: 'Boleto' },
    { id: 6, type: 'in',  desc: 'Venda · Access Point Wi-Fi 6', cat: 'Vendas', value: 1150, at: d(-1, 14), method: 'Cartão' },
    { id: 7, type: 'out', desc: 'Combustível das visitas', cat: 'Operação', value: 410, at: d(-4, 9), method: 'Débito' },
    { id: 8, type: 'in',  desc: 'Avulso · Configuração de impressora Zebra', cat: 'Serviços', value: 180, at: d(-2, 10), method: 'Pix' },
    { id: 9, type: 'in',  desc: 'Contrato mensal · Colégio Novo Saber', cat: 'Contratos', value: 1500, at: d(-11, 15), method: 'Boleto' },
    { id: 10, type: 'out', desc: 'Internet e telefone', cat: 'Fixas', value: 189, at: d(-2, 9), method: 'Débito' },
  ];

  const notifs = [
    { id: 1, icon: 'alert', tone: 'danger', text: 'Backup do servidor da Lima & Associados está atrasado (crítica)', at: d(0, 9), unread: true },
    { id: 2, icon: 'user', tone: 'warn', text: '3 OS abertas estão sem técnico', at: d(0, 8), unread: true },
    { id: 3, icon: 'box', tone: 'warn', text: 'Memória DDR4 16GB e Balun par estão zerados no estoque', at: d(-1, 18), unread: true },
    { id: 4, icon: 'repeat', tone: 'brand', text: 'Fornecedor recebeu o equipamento do RMA', at: d(-1, 15) },
  ];

  return { v: SEED_VERSION, clients, techs, orders, catalogo, tx, appts: [], notifs, nextId: { order: orders.length + 1, client: 11, catalogo: catalogo.length + 1, tx: 11, appt: 1 } };
}

const DB = {
  key: 'sumos-db',
  data: null,
  load() {
    try {
      const raw = JSON.parse(localStorage.getItem(this.key));
      if (raw && raw.v === SEED_VERSION) { this.data = raw; return; }
    } catch {}
    this.data = buildSeed();
  },
  save() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch {}
  },
  reset() {
    this.data = buildSeed();
    this.save();
  },
};
DB.load();
