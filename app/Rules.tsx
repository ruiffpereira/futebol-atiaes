'use client';
const DGREEN = '#0f4d2e';
const Title = ({ children }: { children: React.ReactNode }) => <div className="cond" style={{ fontWeight: 800, fontSize: 17, color: DGREEN, textTransform: 'uppercase', letterSpacing: .4, margin: '0 0 8px' }}>{children}</div>;

// Regulamento completo (do ficheiro do utilizador).
export default function Rules({ onClose }: { onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(8,30,18,.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '18px 14px', overflowY: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 680, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 36px)' }}>
        <div style={{ background: 'linear-gradient(135deg,#0c2a1c,#15803d)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="cond" style={{ fontWeight: 800, fontSize: 22, color: '#fff', textTransform: 'uppercase', lineHeight: 1 }}>Regulamento</div>
            <div style={{ fontSize: 12, color: '#bbf7d0', fontWeight: 600, marginTop: 2 }}>Torneio Futebol 5 · Atiães em Movimento</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'rgba(255,255,255,.2)', color: '#fff', width: 32, height: 32, borderRadius: 9, fontSize: 18 }}>×</button>
        </div>
        <div style={{ padding: '20px 22px 26px', overflowY: 'auto', flex: 1, minHeight: 0, color: '#22332b', fontSize: 14, lineHeight: 1.6 }}>
          <Title>Participação de equipas e atletas</Title>
          <ul style={{ margin: '0 0 18px', paddingLeft: 20 }}>
            <li>Inscrição feita através da organização e homologada por esta.</li>
            <li>Todos os jogadores entregam o «Termo de responsabilidade» preenchido e assinado.</li>
            <li>Ter conhecimento deste regulamento.</li>
          </ul>
          <Title>Regras gerais</Title>
          <ol style={{ margin: '0 0 18px', paddingLeft: 20 }}>
            <li>Inscrição: 75€ (equipas novas) ou 50€ (equipas da edição anterior).</li>
            <li>Inscrição de equipas até 15 de junho de 2025.</li>
            <li>Inscrição de atletas até 25 de junho de 2025.</li>
            <li>Mínimo de 5 atletas por equipa.</li>
            <li>Substituições junto ao banco e ilimitadas.</li>
            <li>Todos os atletas têm de constar na ficha de jogo.</li>
            <li>Cada equipa é obrigada a ter um capitão.</li>
            <li>Termos de responsabilidade entregues antes do 1º jogo da equipa.</li>
            <li>Um atleta não pode participar por mais do que uma equipa.</li>
            <li>Atrasados só entram até ao fim do 1º tempo; após o início do 2º tempo não entram nem ficam no banco.</li>
          </ol>
          <Title>Datas e local</Title>
          <ul style={{ margin: '0 0 18px', paddingLeft: 20 }}>
            <li>28/06/2025 — jogos das 8h30 às 23h50, no campo de futebol 5 em Atiães.</li>
            <li>29/06/2025 — jogos das 9h00 às 12h35.</li>
            <li>Sorteio: 22/05 às 18h00, no café «O Madeirense», junto ao campo.</li>
          </ul>
          <Title>Disciplina</Title>
          <ul style={{ margin: '0 0 18px', paddingLeft: 20 }}>
            <li>Perde o jogo (derrota por 3 golos) a equipa que falte ou cujo atleta agrida alguém.</li>
            <li>Máximo de 5 jogadores por equipa, um como guarda-redes equipado.</li>
            <li>Mínimo de 4 atletas para começar; 10 min de tolerância, senão derrota por 3-0.</li>
            <li>Dois tempos de 15 minutos, intervalo de 5 minutos.</li>
            <li>Cartão vermelho: jogador não regressa; equipa com menos um durante 2 min (ou até sofrer golo).</li>
            <li>Agressão = expulsão automática do torneio.</li>
            <li>Cores coincidentes: a equipa visitante veste coletes.</li>
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
