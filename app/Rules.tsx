'use client';
const DGREEN = '#0f4d2e';
const Title = ({ children }: { children: React.ReactNode }) => <div className="cond" style={{ fontWeight: 800, fontSize: 17, color: DGREEN, textTransform: 'uppercase', letterSpacing: .4, margin: '0 0 8px' }}>{children}</div>;

// Regulamento completo (do ficheiro do utilizador).
export default function Rules({ onClose }: { onClose: () => void }) {
  return (
    <div className="m-fade" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(8,30,18,.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '18px 14px', overflowY: 'auto' }}>
      <div className="m-pop" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 680, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 36px)' }}>
        <div style={{ background: 'linear-gradient(135deg,#0c2a1c,#15803d)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="cond" style={{ fontWeight: 800, fontSize: 22, color: '#fff', textTransform: 'uppercase', lineHeight: 1 }}>Regulamento</div>
            <div style={{ fontSize: 12, color: '#bbf7d0', fontWeight: 600, marginTop: 2 }}>Torneio Futebol 5 · Atiães em Movimento · 4ª Edição</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'rgba(255,255,255,.2)', color: '#fff', width: 32, height: 32, borderRadius: 9, fontSize: 18 }}>×</button>
        </div>
        <div style={{ padding: '20px 22px 26px', overflowY: 'auto', flex: 1, minHeight: 0, color: '#22332b', fontSize: 14, lineHeight: 1.6 }}>
          <Title>Participação de equipas e atletas</Title>
          <ul style={{ margin: '0 0 18px', paddingLeft: 20 }}>
            <li>Inscrição realizada através da organização do Torneio.</li>
            <li>Pedido de inscrição homologado pela organização do Torneio.</li>
            <li>Ter conhecimento deste regulamento.</li>
          </ul>
          <Title>Regras gerais</Title>
          <ol style={{ margin: '0 0 18px', paddingLeft: 20 }}>
            <li>Custo de inscrição por equipa: 75€.</li>
            <li>Inscrição de equipas até 24 de junho de 2026.</li>
            <li>Inscrição de atletas até 26 de junho de 2026.</li>
            <li>Cada equipa inscreve no mínimo 5 atletas.</li>
            <li>Substituições junto ao banco de suplentes e ilimitadas.</li>
            <li>Todos os atletas têm de constar na ficha de jogo.</li>
            <li>Cada equipa é obrigada a ter um capitão.</li>
            <li>Um atleta não pode participar por mais do que uma equipa.</li>
            <li>Atrasados podem entrar até ao fim do 1º tempo se estiverem na ficha de jogo; após o início do 2º tempo não entram nem ficam no banco.</li>
          </ol>
          <Title>Data e local</Title>
          <ul style={{ margin: '0 0 18px', paddingLeft: 20 }}>
            <li>27/06/2026 — jogos das 8h30 às 23h50, no campo de futebol 5 em Atiães.</li>
            <li>28/06/2026 — jogos das 9h00 às 12h35.</li>
            <li>Sorteio: 24/06/2026 às 21h00, junto ao campo de futebol 5 em Atiães.</li>
            <li>O calendário completo depende do número de equipas inscritas.</li>
          </ul>
          <Title>Disciplina</Title>
          <ul style={{ margin: '0 0 18px', paddingLeft: 20 }}>
            <li>Perde o jogo (derrota por 3 golos) a equipa que não compareça, ou cujo atleta agrida outro atleta, árbitro ou membro da organização.</li>
            <li>Máximo de 5 jogadores por equipa, um como guarda-redes devidamente equipado.</li>
            <li>Mínimo de 4 atletas para começar à hora marcada; 10 min de tolerância, senão derrota por 3-0.</li>
            <li>Dois tempos de 15 minutos, com intervalo de 5 minutos.</li>
            <li>Cartão vermelho: jogador não regressa; equipa com menos um durante 2 min (ou até sofrer golo).</li>
            <li>Agressão a atleta, árbitro ou organização = expulsão automática do torneio.</li>
            <li>Cores coincidentes: a equipa que joga fora veste coletes.</li>
            <li>Equipa sem equipamento veste coletes.</li>
          </ul>
          <Title>Critérios técnicos</Title>
          <ul style={{ margin: '0 0 10px', paddingLeft: 20 }}>
            <li>Regras de futebol 5; lançamentos laterais com o pé.</li>
            <li>O guarda-redes não joga com as mãos uma bola pontapeada por um colega.</li>
          </ul>
          <div style={{ background: '#f6faf4', border: '1px solid #e1ece0', borderRadius: 11, padding: '12px 14px', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, color: DGREEN, marginBottom: 4 }}>Desempate na fase de grupos (por ordem):</div>
            <div>1) Confronto direto · 2) Diferença de golos · 3) Mais golos marcados · 4) Menor média de idades</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <span style={{ background: '#dcfce7', color: '#15803d', fontWeight: 700, padding: '5px 11px', borderRadius: 8, fontSize: 13 }}>Vitória = 3 pts</span>
            <span style={{ background: '#eef2ec', color: '#5b7163', fontWeight: 700, padding: '5px 11px', borderRadius: 8, fontSize: 13 }}>Empate = 1 pt</span>
            <span style={{ background: '#fdeaea', color: '#dc2626', fontWeight: 700, padding: '5px 11px', borderRadius: 8, fontSize: 13 }}>Derrota/ausência = 0 pts</span>
          </div>
          <p style={{ margin: '0 0 18px', color: '#5b7163' }}>Nas fases a eliminar, empate é decidido por <b>penáltis em séries de 3</b>.</p>
          <Title>Prémios</Title>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Troféus para 1º, 2º e 3º lugar.</li>
            <li>Troféu para o melhor guarda-redes (eleito pela organização).</li>
            <li>Troféu para o melhor marcador.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
