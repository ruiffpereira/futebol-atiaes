"use client";
// PLACAR PÚBLICO — só leitura, tempo real (React Query + SSE).
// Visual segue o protótipo em /design-reference (Torneio.dc.html).
import { useState, useEffect } from "react";
import { useTournament } from "@/lib/useTournament";
import { useNotifications } from "@/lib/useNotifications";
import {
  standings,
  topScorers,
  topGoalkeepers,
  scoreOf,
  phaseLabel,
  liveBadge,
  liveText,
  srcLabel,
} from "@/lib/tournament";
import type { Match, TournamentState } from "@/lib/types";
import Rules from "./Rules";
import MatchDetail from "./MatchDetail";

const GREEN = "#15803d",
  DGREEN = "#0f4d2e";
type Tab = "standings" | "live" | "schedule" | "stats" | "profile";

export default function PublicPage() {
  const { state } = useTournament();
  const { on, supported, enable } = useNotifications();
  const [tab, setTab] = useState<Tab>("standings");
  const [rules, setRules] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);

  const tn = (id: string | null) => state.teams.find((t) => t.id === id);
  const nameOf = (m: Match, side: "a" | "b") => {
    const t = tn(m[side]);
    return t ? t.name : srcLabel(side === "a" ? m.srcA : m.srcB);
  };
  const live = state.matches.filter((m) => m.status === "live");
  const upcoming = state.matches.filter(
    (m) => m.status === "scheduled" && m.a && m.b,
  );
  const recent = state.matches
    .filter((m) => m.status === "done")
    .sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0));
  const scorers = topScorers(state),
    keepers = topGoalkeepers(state);
  const ko = (phase: string, slot?: number) =>
    state.matches.find(
      (m) => m.phase === phase && (slot ? m.slot === slot : true),
    );
  const detailMatch = detail
    ? state.matches.find((m) => m.id === detail)
    : null;

  const tabBtn = (id: Tab, label: string) => (
    <button
      onClick={() => setTab(id)}
      style={{
        position: "relative",
        flexShrink: 0,
        border: "1px solid #d3e0d0",
        background: "#fff",
        color: "#13241b",
        fontWeight: 700,
        fontSize: 13.5,
        padding: "10px 16px",
        borderRadius: 11,
      }}
    >
      {label}
      {tab === id && (
        <div
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            bottom: 4,
            height: 3,
            background: GREEN,
            borderRadius: 3,
          }}
        />
      )}
    </button>
  );
  const navBtn = (
    id: Tab,
    icon: string,
    label: string,
    activeColor = GREEN,
  ) => (
    <button
      onClick={() => setTab(id)}
      style={{
        flex: 1,
        border: "none",
        background: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        padding: "6px 2px",
        color: tab === id ? activeColor : "#9aa8a0",
      }}
    >
      <span style={{ fontSize: 19 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 700 }}>{label}</span>
    </button>
  );

  return (
    <div style={{ minHeight: "100vh" }}>
      <Header
        name={state.tournamentName}
        sub={state.subtitle}
        liveCount={live.length}
      />
      <div
        className="pub-pad"
        style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 20px 60px" }}
      >
        <div
          className="hide-mobile"
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 14,
          }}
        >
          {tabBtn("standings", "CLASSIFICAÇÃO")}
          {tabBtn("live", "AO VIVO")}
          {tabBtn("schedule", "CALENDÁRIO")}
          {tabBtn("stats", "ESTATÍSTICAS")}
          {tabBtn("profile", "PERFIL")}
        </div>

        {tab === "standings" &&
          (state.groups.some((g) => state.teams.some((t) => t.group === g)) ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(min(100%,290px),1fr))",
                gap: 18,
              }}
            >
              {state.groups.map((g) => (
                <GroupCard key={g} g={g} state={state} />
              ))}
            </div>
          ) : (
            <Empty icon="📋" title="Ainda sem equipas." />
          ))}

        {tab === "live" &&
          (live.length ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(min(100%,300px),1fr))",
                gap: 16,
              }}
            >
              {live.map((m) => (
                <LiveCard
                  key={m.id}
                  m={m}
                  nameOf={nameOf}
                  onClick={() => setDetail(m.id)}
                />
              ))}
            </div>
          ) : (
            <Empty
              icon="🕐"
              title="Nenhum jogo a decorrer."
              sub="Os jogos ao vivo aparecem aqui."
            />
          ))}

        {tab === "schedule" && (
          <div style={{ display: "grid", gap: 24 }}>
            <Section title="Próximos jogos">
              {upcoming.length ? (
                upcoming.map((m) => <Line key={m.id} m={m} nameOf={nameOf} />)
              ) : (
                <EmptyLine text="Sem jogos agendados." />
              )}
            </Section>
            <Section title="Resultados">
              {recent.length ? (
                recent.map((m) => (
                  <Line
                    key={m.id}
                    m={m}
                    nameOf={nameOf}
                    score
                    onClick={() => setDetail(m.id)}
                  />
                ))
              ) : (
                <EmptyLine text="Ainda sem resultados." />
              )}
            </Section>
            {state.knockoutCreated && (
              <Section title="Fase final">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(min(100%,240px),1fr))",
                    gap: 18,
                    alignItems: "start",
                  }}
                >
                  <div>
                    <H sm>Meias-finais</H>
                    <KoCard
                      m={ko("sf", 1)}
                      nameOf={nameOf}
                      onClick={setDetail}
                    />
                    <div style={{ height: 12 }} />
                    <KoCard
                      m={ko("sf", 2)}
                      nameOf={nameOf}
                      onClick={setDetail}
                    />
                  </div>
                  <div>
                    <H sm>Final</H>
                    <KoCard
                      m={ko("final")}
                      nameOf={nameOf}
                      onClick={setDetail}
                    />
                    <H sm>3º e 4º lugar</H>
                    <KoCard
                      m={ko("third")}
                      nameOf={nameOf}
                      onClick={setDetail}
                    />
                  </div>
                </div>
              </Section>
            )}
          </div>
        )}

        {tab === "stats" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(min(100%,300px),1fr))",
              gap: 22,
              alignItems: "start",
            }}
          >
            <div>
              <H>🏆 Melhores marcadores</H>
              {scorers.length ? (
                <Card>
                  {scorers.map((p, i) => (
                    <Row3
                      key={p.id}
                      i={i + 1}
                      name={p.name}
                      sub={p.team}
                      val={p.goals}
                      color={GREEN}
                    />
                  ))}
                </Card>
              ) : (
                <EmptyLine text="Sem golos registados." />
              )}
            </div>
            <div>
              <H>🧤 Melhores guarda-redes</H>
              <div
                style={{ fontSize: 12.5, color: "#8aa093", margin: "0 0 10px" }}
              >
                Menos golos sofridos pela equipa.
              </div>
              {keepers.length ? (
                <Card>
                  {keepers.map((p, i) => (
                    <Row3
                      key={p.id}
                      i={i + 1}
                      name={p.name}
                      sub={p.team}
                      val={p.conceded}
                      color="#1d4ed8"
                      extra={p.games + "J"}
                    />
                  ))}
                </Card>
              ) : (
                <EmptyLine text="Sem guarda-redes definidos." />
              )}
            </div>
          </div>
        )}

        {tab === "profile" && (
          <Profile
            notifyOn={on}
            supported={supported}
            onNotify={enable}
            onRules={() => setRules(true)}
          />
        )}
      </div>

      <div
        className="only-mobile"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          background: "#fff",
          borderTop: "1px solid #e1e8dd",
          boxShadow: "0 -4px 16px rgba(8,46,28,.08)",
          padding: "5px 4px",
        }}
      >
        {navBtn("standings", "🏆", "Classif.")}
        {navBtn("live", "📺", "Ao Vivo", "#dc2626")}
        {navBtn("schedule", "📅", "Calend.")}
        {navBtn("stats", "📊", "Estat.")}
        {navBtn("profile", "👤", "Perfil / Regras")}
      </div>

      {rules && <Rules onClose={() => setRules(false)} />}
      {detailMatch && (
        <MatchDetail
          m={detailMatch}
          state={state}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

function Header({
  name,
  sub,
  liveCount,
}: {
  name: string;
  sub: string;
  liveCount: number;
}) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "linear-gradient(120deg,#0f4d2e,#15803d 60%,#1a9e4b)",
        boxShadow: "0 2px 18px rgba(8,46,28,.35)",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "#bef264",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
          }}
        >
          ⚽
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="cond"
            style={{
              fontWeight: 800,
              fontSize: 26,
              color: "#fff",
              textTransform: "uppercase",
              lineHeight: 0.95,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: "#bbf7d0",
              fontWeight: 600,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            {sub}
          </div>
        </div>
        <a
          href="https://rufvision.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,.14)",
            color: "#eafff1",
            fontWeight: 600,
            fontSize: 11.5,
            padding: "6px 11px 6px 7px",
            borderRadius: 10,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 26,
              height: 26,
              borderRadius: 7,
              background: "#fff",
              flexShrink: 0,
            }}
          >
            <svg width="22" height="16" viewBox="0 0 44 32" aria-hidden="true">
              <text
                x="0"
                y="25"
                fontFamily="Arial, sans-serif"
                fontWeight="800"
                fontSize="28"
                fill="#14274a"
              >
                R
              </text>
              <text
                x="20"
                y="25"
                fontFamily="Arial, sans-serif"
                fontWeight="800"
                fontSize="28"
                fill="#ed1c24"
              >
                V
              </text>
            </svg>
          </span>
          <span>
            App desenvolvida por <b style={{ color: "#bef264" }}>RufVision</b>
          </span>
        </a>
        {liveCount > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "#dc2626",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: "#fff",
                animation: "pulse 1.1s infinite",
              }}
            />
            {liveCount}
          </div>
        )}
      </div>
    </div>
  );
}

function Profile({
  notifyOn,
  supported,
  onNotify,
  onRules,
}: {
  notifyOn: boolean;
  supported: boolean;
  onNotify: () => void;
  onRules: () => void;
}) {
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    const ua = nav.userAgent || "";
    setIos(
      /iphone|ipad|ipod/i.test(ua) ||
        (nav.platform === "MacIntel" && nav.maxTouchPoints > 1),
    );
    setStandalone(
      window.matchMedia?.("(display-mode: standalone)").matches ||
        nav.standalone === true,
    );
  }, []);

  const rowLink = (
    icon: string,
    label: string,
    onClick?: () => void,
    href?: string,
  ) => {
    const inner = (
      <>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#13241b" }}>
          {label}
        </span>
        <span style={{ marginLeft: "auto", color: "#9bb0a3", fontSize: 20 }}>
          ›
        </span>
      </>
    );
    const base: React.CSSProperties = {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "16px 18px",
      background: "#fff",
      border: "1px solid #e4ece0",
      borderRadius: 16,
      textDecoration: "none",
      cursor: "pointer",
    };
    return href ? (
      <a href={href} style={base}>
        {inner}
      </a>
    ) : (
      <button onClick={onClick} style={{ ...base, textAlign: "left" }}>
        {inner}
      </button>
    );
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", display: "grid", gap: 16 }}>
      {/* Notificações */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e4ece0",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: DGREEN,
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>🔔</span>
          <span
            className="cond"
            style={{
              fontWeight: 800,
              fontSize: 18,
              color: "#fff",
              textTransform: "uppercase",
            }}
          >
            Notificações
          </span>
        </div>
        <div style={{ padding: "16px 18px" }}>
          {!supported && !standalone && (
            <div
              style={{
                background: "#fdeaea",
                border: "1px solid #f3c9c9",
                color: "#b91c1c",
                borderRadius: 11,
                padding: "11px 14px",
                fontSize: 13.5,
                marginBottom: 14,
              }}
            >
              Este navegador não suporta notificações. No iPhone, adiciona
              primeiro o site ao ecrã principal (passos abaixo).
            </div>
          )}
          {notifyOn ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: GREEN,
                fontWeight: 700,
                fontSize: 14.5,
              }}
            >
              ✓ Notificações ativadas neste dispositivo.
            </div>
          ) : (
            <button
              onClick={onNotify}
              style={{
                width: "100%",
                border: "none",
                background: GREEN,
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                padding: "12px",
                borderRadius: 11,
              }}
            >
              Ativar notificações
            </button>
          )}

          {!notifyOn && (
            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
              {/* Android */}
              <div
                style={{
                  background: "#f6faf4",
                  border: `1px solid ${ios ? "#e1ece0" : "#bef264"}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: DGREEN,
                    marginBottom: 6,
                    fontSize: 14,
                  }}
                >
                  🤖 Android (Chrome)
                </div>
                <div
                  style={{ fontSize: 13.5, color: "#3a4a40", lineHeight: 1.5 }}
                >
                  Toca em <b>«Ativar notificações»</b> aqui em cima e aceita o
                  pedido do navegador. Está feito.
                </div>
              </div>
              {/* iOS */}
              <div
                style={{
                  background: "#f6faf4",
                  border: `1px solid ${ios ? "#bef264" : "#e1ece0"}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: DGREEN,
                    marginBottom: 6,
                    fontSize: 14,
                  }}
                >
                  🍎 iPhone / iPad (iOS 16.4 ou superior)
                </div>
                {ios && !standalone && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#b45309",
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    No iPhone, o botão só funciona depois de adicionares o site
                    ao ecrã principal:
                  </div>
                )}
                <ol
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    fontSize: 13.5,
                    color: "#3a4a40",
                    lineHeight: 1.6,
                  }}
                >
                  <li>
                    Abre este site no <b>Safari</b>.
                  </li>
                  <li>
                    Toca no botão <b>Partilhar</b> (o quadrado com a seta ↑).
                  </li>
                  <li>
                    Escolhe <b>«Adicionar ao ecrã principal»</b>.
                  </li>
                  <li>
                    Abre a app pelo <b>ícone</b> criado no ecrã principal.
                  </li>
                  <li>
                    Volta a este separador <b>Perfil</b> e toca em{" "}
                    <b>«Ativar notificações»</b>.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>

      {rowLink("📋", "Regulamento do torneio", onRules)}
      {rowLink("🔐", "Backoffice", undefined, "/admin")}
    </div>
  );
}

function GroupCard({ g, state }: { g: string; state: TournamentState }) {
  const rows = standings(state, g);
  const liveIds = new Set<string>();
  const liveInfo: Record<string, string> = {};
  state.matches
    .filter((m) => m.phase === "group" && m.group === g && m.status === "live")
    .forEach((m) => {
      const an = state.teams.find((t) => t.id === m.a)?.name || "?",
        bn = state.teams.find((t) => t.id === m.b)?.name || "?";
      if (m.a) {
        liveIds.add(m.a);
        liveInfo[m.a] = scoreOf(m, m.a) + "–" + scoreOf(m, m.b) + " vs " + bn;
      }
      if (m.b) {
        liveIds.add(m.b);
        liveInfo[m.b] = scoreOf(m, m.b) + "–" + scoreOf(m, m.a) + " vs " + an;
      }
    });
  const cols = "26px 1fr 30px 30px 30px 30px 44px 38px";
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #e4ece0",
      }}
    >
      <div
        style={{
          background: DGREEN,
          padding: "12px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          className="cond"
          style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}
        >
          GRUPO {g}
        </span>
        <span style={{ fontSize: 12, color: "#bbf7d0", fontWeight: 600 }}>
          {rows.length} equipas
        </span>
      </div>
      <div style={{ padding: "6px 8px 10px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: cols,
            gap: 2,
            padding: 8,
            fontSize: 11,
            fontWeight: 700,
            color: "#6b8475",
            textTransform: "uppercase",
          }}
        >
          <span />
          <span />
          <span style={{ textAlign: "center" }}>J</span>
          <span style={{ textAlign: "center" }}>V</span>
          <span style={{ textAlign: "center" }}>E</span>
          <span style={{ textAlign: "center" }}>D</span>
          <span style={{ textAlign: "center" }}>DG</span>
          <span style={{ textAlign: "center" }}>Pts</span>
        </div>
        {rows.map((r, i) => (
          <div
            key={r.team.id}
            style={{
              display: "grid",
              gridTemplateColumns: cols,
              gap: 2,
              alignItems: "center",
              padding: "9px 8px",
              borderLeft: `4px solid ${i < 2 ? "#bef264" : "transparent"}`,
              background: liveIds.has(r.team.id) ? "#fff7f5" : "transparent",
            }}
          >
            <span
              style={{ fontWeight: 800, textAlign: "center", color: GREEN }}
            >
              {i + 1}
            </span>
            <div style={{ minWidth: 0 }}>
              <span
                style={{
                  fontWeight: 600,
                  display: "block",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {r.team.name}
              </span>
              {liveIds.has(r.team.id) && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#dc2626",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#dc2626",
                      animation: "pulse 1.1s infinite",
                    }}
                  />
                  AO VIVO {liveInfo[r.team.id]}
                </div>
              )}
            </div>
            <span style={{ textAlign: "center", color: "#5b7163" }}>{r.P}</span>
            <span style={{ textAlign: "center", color: "#5b7163" }}>{r.W}</span>
            <span style={{ textAlign: "center", color: "#5b7163" }}>{r.D}</span>
            <span style={{ textAlign: "center", color: "#5b7163" }}>{r.L}</span>
            <span style={{ textAlign: "center", fontWeight: 600 }}>
              {(r.GF - r.GA > 0 ? "+" : "") + (r.GF - r.GA)}
            </span>
            <span
              className="cond"
              style={{
                textAlign: "center",
                fontWeight: 800,
                fontSize: 15,
                color: DGREEN,
              }}
            >
              {r.Pts}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveCard({
  m,
  nameOf,
  onClick,
}: {
  m: Match;
  nameOf: (m: Match, s: "a" | "b") => string;
  onClick: () => void;
}) {
  const half = m.livePhase === "half";
  return (
    <div
      onClick={onClick}
      style={{
        background: "linear-gradient(150deg,#0c2a1c,#103d28)",
        borderRadius: 18,
        padding: "18px 20px",
        color: "#fff",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#bbf7d0",
            textTransform: "uppercase",
          }}
        >
          {phaseLabel(m)}
        </span>
        <span
          style={{
            background: half ? "#d97706" : "#dc2626",
            padding: "4px 10px",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          {liveBadge(m)}
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          className="cond"
          style={{ textAlign: "right", fontWeight: 700, fontSize: 21 }}
        >
          {nameOf(m, "a")}
        </div>
        <div className="cond" style={{ fontWeight: 800, fontSize: 40 }}>
          {scoreOf(m, m.a)} : {scoreOf(m, m.b)}
        </div>
        <div
          className="cond"
          style={{ textAlign: "left", fontWeight: 700, fontSize: 21 }}
        >
          {nameOf(m, "b")}
        </div>
      </div>
    </div>
  );
}

function KoCard({
  m,
  nameOf,
  onClick,
}: {
  m?: Match;
  nameOf: (m: Match, s: "a" | "b") => string;
  onClick: (id: string) => void;
}) {
  if (!m) return null;
  const sa = scoreOf(m, m.a),
    sb = scoreOf(m, m.b);
  const doneM = m.status === "done" && m.a && m.b;
  const aw =
    !!doneM && (sa > sb || (sa === sb && (m.penA || 0) > (m.penB || 0)));
  const bw =
    !!doneM && (sb > sa || (sa === sb && (m.penB || 0) > (m.penA || 0)));
  const cell = (
    name: string,
    score: number,
    win: boolean,
    pending: boolean,
  ) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "11px 14px",
      }}
    >
      <span
        style={{
          fontWeight: 600,
          color: pending ? "#9bb0a3" : "#13241b",
          fontStyle: pending ? "italic" : "normal",
        }}
      >
        {win ? "🏆 " : ""}
        {name}
      </span>
      <span
        className="cond"
        style={{ fontWeight: 800, fontSize: 20, color: DGREEN }}
      >
        {score}
      </span>
    </div>
  );
  return (
    <div
      onClick={() => onClick(m.id)}
      style={{
        background: "#fff",
        border: "1px solid #e4ece0",
        borderRadius: 13,
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      {cell(nameOf(m, "a"), sa, aw, !m.a)}
      <div style={{ height: 1, background: "#f0f4ee" }} />
      {cell(nameOf(m, "b"), sb, bw, !m.b)}
      {m.status === "live" && (
        <div
          style={{
            background: m.livePhase === "half" ? "#d97706" : "#dc2626",
            padding: "5px 14px",
            fontSize: 11,
            fontWeight: 800,
            color: "#fff",
          }}
        >
          {liveBadge(m)}
        </div>
      )}
    </div>
  );
}

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div>
    <div
      className="cond"
      style={{
        fontWeight: 700,
        fontSize: 18,
        color: DGREEN,
        textTransform: "uppercase",
        marginBottom: 10,
      }}
    >
      {title}
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {children}
    </div>
  </div>
);
function Line({
  m,
  nameOf,
  score,
  onClick,
}: {
  m: Match;
  nameOf: (m: Match, s: "a" | "b") => string;
  score?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "12px 16px",
        border: "1px solid #e4ece0",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {m.time ? (
          <span
            className="cond"
            style={{
              fontWeight: 800,
              fontSize: 14,
              color: "#fff",
              background: GREEN,
              padding: "2px 9px",
              borderRadius: 6,
            }}
          >
            {m.time}
          </span>
        ) : null}
        {m.phase === "friendly" ? (
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "#fff",
              background: "#7c3aed",
              padding: "2px 8px",
              borderRadius: 6,
            }}
          >
            AMIGÁVEL
          </span>
        ) : (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: score ? "#9bb0a3" : GREEN,
              textTransform: "uppercase",
            }}
          >
            {phaseLabel(m)}
          </span>
        )}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ textAlign: "right", fontWeight: 600 }}>
          {nameOf(m, "a")}
        </span>
        <span
          className="cond"
          style={{
            fontWeight: 800,
            fontSize: score ? 20 : 12,
            color: score ? DGREEN : "#9bb0a3",
            background: "#eef2ec",
            padding: "3px 11px",
            borderRadius: 7,
          }}
        >
          {score ? `${scoreOf(m, m.a)} : ${scoreOf(m, m.b)}` : "vs"}
        </span>
        <span style={{ textAlign: "left", fontWeight: 600 }}>
          {nameOf(m, "b")}
        </span>
      </div>
    </div>
  );
}

const H = ({ children, sm }: { children: React.ReactNode; sm?: boolean }) => (
  <div
    className="cond"
    style={{
      fontWeight: 800,
      fontSize: sm ? 16 : 22,
      color: DGREEN,
      textTransform: "uppercase",
      margin: sm ? "0 0 10px" : "0 0 12px",
    }}
  >
    {children}
  </div>
);
const Card = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 16,
      overflow: "hidden",
      border: "1px solid #e4ece0",
    }}
  >
    {children}
  </div>
);
const Row3 = ({
  i,
  name,
  sub,
  val,
  color,
  extra,
}: {
  i: number;
  name: string;
  sub: string;
  val: number;
  color: string;
  extra?: string;
}) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "34px 1fr auto auto",
      alignItems: "center",
      gap: 12,
      padding: "13px 18px",
      borderBottom: "1px solid #f0f4ee",
    }}
  >
    <span
      className="cond"
      style={{ fontWeight: 800, fontSize: 18, color, textAlign: "center" }}
    >
      {i}
    </span>
    <div>
      <div style={{ fontWeight: 600 }}>{name}</div>
      <div style={{ fontSize: 12, color: "#8aa093" }}>{sub}</div>
    </div>
    {extra ? (
      <span style={{ fontSize: 12, color: "#5b7163", fontWeight: 600 }}>
        {extra}
      </span>
    ) : (
      <span />
    )}
    <span
      className="cond"
      style={{ fontWeight: 800, fontSize: 22, color: DGREEN }}
    >
      {val}
    </span>
  </div>
);
const Empty = ({
  icon,
  title,
  sub,
}: {
  icon: string;
  title: string;
  sub?: string;
}) => (
  <div style={{ textAlign: "center", padding: "70px 20px", color: "#8aa093" }}>
    <div style={{ fontSize: 42, marginBottom: 10 }}>{icon}</div>
    <div style={{ fontSize: 17, fontWeight: 600 }}>{title}</div>
    {sub && <div style={{ fontSize: 14, marginTop: 4 }}>{sub}</div>}
  </div>
);
const EmptyLine = ({ text }: { text: string }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 12,
      padding: 24,
      textAlign: "center",
      color: "#8aa093",
      border: "1px solid #e4ece0",
      fontSize: 14,
    }}
  >
    {text}
  </div>
);
