"use client";
// PLACAR PÚBLICO — só leitura, tempo real (React Query + SSE).
// Visual segue o protótipo em /design-reference (Torneio.dc.html).
import { useState, useEffect } from "react";
import { useTournament } from "@/lib/useTournament";
import { useNotifications } from "@/lib/useNotifications";
import {
  standings,
  topScorers,
  bestAttack,
  bestDefense,
  scoreOf,
  phaseLabel,
  liveBadge,
  liveText,
  srcLabel,
  fmtDate,
} from "@/lib/tournament";
import type { Match, TournamentState } from "@/lib/types";
import Rules from "./Rules";
import MatchDetail from "./MatchDetail";
import TeamDetail from "./TeamDetail";
import {
  Trophy,
  Broadcast,
  Calendar,
  Chart,
  User,
  Bell,
  BellOff,
  Ball,
  Shield,
  Clock,
  Document,
  MapPin,
  Chevron,
  Check,
  List,
  Chat,
  Send,
  Info,
  Download,
  Share,
  PlusSquare,
  TeamBadge,
} from "./Icons";

const GREEN = "#15803d",
  DGREEN = "#0f4d2e";
// paleta "clean & arejado"
const INK = "#16201b",
  MUTED = "#8a978f",
  LINE = "#edf0ec",
  SOFT = "0 1px 2px rgba(18,40,28,.04), 0 6px 16px rgba(18,40,28,.03)";
type Tab = "standings" | "live" | "schedule" | "stats" | "profile";
const TAB_TITLE: Record<Tab, string> = {
  standings: "Classificação",
  live: "Ao Vivo",
  schedule: "Calendário",
  stats: "Estatísticas",
  profile: "Info",
};

type InstallInfo = {
  canShow: boolean;
  platform: "ios" | "android" | "other";
  promptInstall: () => void;
};

// Deteção de instalação PWA (Android via beforeinstallprompt, iOS via instruções).
// Só "canShow" em telemóvel e quando NÃO está instalada (esconde em desktop/instalada).
function useInstall(): InstallInfo {
  const [deferred, setDeferred] = useState<{
    prompt: () => void;
    userChoice: Promise<unknown>;
  } | null>(null);
  const [installed, setInstalled] = useState(true); // assume escondido até confirmar
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean; maxTouchPoints: number };
    const ua = nav.userAgent || "";
    const isIOS =
      /iphone|ipad|ipod/i.test(ua) ||
      (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
    const isAndroid = /android/i.test(ua);
    setPlatform(isIOS ? "ios" : isAndroid ? "android" : "other");
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      nav.standalone === true;
    setInstalled(!!standalone);

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as unknown as { prompt: () => void; userChoice: Promise<unknown> });
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = () => {
    if (!deferred) return;
    deferred.prompt();
    deferred.userChoice.finally(() => setDeferred(null));
  };
  const canShow =
    !installed &&
    (platform === "ios" || (platform === "android" && !!deferred));
  return { canShow, platform, promptInstall };
}

export default function PublicPage() {
  const { state, loading } = useTournament();
  const { on, supported, enable } = useNotifications();
  const install = useInstall();
  const [tab, setTab] = useState<Tab>("standings");
  const [rules, setRules] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

  // conta uma visita por abertura da página
  useEffect(() => {
    fetch("/api/visit", { method: "POST" }).catch(() => {});
  }, []);

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
  const scorers = topScorers(state).slice(0, 5),
    attack = bestAttack(state).slice(0, 5),
    defense = bestDefense(state).slice(0, 5);
  const ko = (phase: string, slot?: number) =>
    state.matches.find(
      (m) => m.phase === phase && (slot ? m.slot === slot : true),
    );
  const detailMatch = detail
    ? state.matches.find((m) => m.id === detail)
    : null;
  const detailTeam = teamId
    ? state.teams.find((t) => t.id === teamId)
    : null;

  const tabBtn = (id: Tab, label: string) => {
    const active = tab === id;
    return (
      <button
        onClick={() => setTab(id)}
        style={{
          flexShrink: 0,
          border: "none",
          background: active ? GREEN : "transparent",
          color: active ? "#fff" : "#62736a",
          fontWeight: 700,
          fontSize: 13.5,
          padding: "9px 16px",
          borderRadius: 999,
        }}
      >
        {label}
      </button>
    );
  };
  const navBtn = (
    id: Tab,
    icon: React.ReactNode,
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
        gap: 3,
        padding: "6px 2px",
        color: tab === id ? activeColor : "#9aa8a0",
      }}
    >
      <span style={{ display: "flex", height: 22, alignItems: "center" }}>
        {icon}
      </span>
      <span style={{ fontSize: 10.5, fontWeight: 700 }}>{label}</span>
    </button>
  );

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ minHeight: "100vh" }}>
      <Header
        name={state.tournamentName}
        title={TAB_TITLE[tab]}
        sub={state.subtitle}
        liveCount={live.length}
        notifyOn={on}
        onBell={() => setNotifyOpen(true)}
      />
      <div
        className="pub-pad"
        style={{ maxWidth: 1180, margin: "0 auto", padding: "14px 20px 60px" }}
      >
        <a
          href="https://rufvision.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 6,
            marginBottom: 10,
            color: "#9aa8a0",
            fontSize: 11.5,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <svg width="15" height="11" viewBox="0 0 44 32" aria-hidden="true">
            <text x="0" y="25" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="28" fill="#14274a">R</text>
            <text x="20" y="25" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="28" fill="#ed1c24">V</text>
          </svg>
          Desenvolvido por <b style={{ fontWeight: 700 }}><span style={{ color: "#14274a" }}>Ruf</span><span style={{ color: "#ed1c24" }}>Vision</span></b>
        </a>
        <div
          className="hide-mobile"
          style={{
            display: "flex",
            gap: 4,
            overflowX: "auto",
            padding: 4,
            marginBottom: 18,
            background: "#fff",
            border: `1px solid ${LINE}`,
            borderRadius: 999,
            width: "fit-content",
            boxShadow: SOFT,
          }}
        >
          {tabBtn("standings", "Classificação")}
          {tabBtn("live", "Ao Vivo")}
          {tabBtn("schedule", "Calendário")}
          {tabBtn("stats", "Estatísticas")}
          {tabBtn("profile", "Info")}
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
                <GroupCard key={g} g={g} state={state} onTeam={setTeamId} />
              ))}
            </div>
          ) : (
            <Empty icon={<List size={44} />} title="Ainda sem equipas." />
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
              icon={<Clock size={44} />}
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
            {state.groupsConcluded && (
              <Section title="Fase final">
                <div
                  style={{
                    maxWidth: 620,
                    margin: "0 auto",
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(min(100%,240px),1fr))",
                    gap: 18,
                    alignItems: "start",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <H sm center>
                      Meias-finais
                    </H>
                    <KoCard
                      m={ko("sf", 1)}
                      nameOf={nameOf}
                      onClick={setDetail}
                    />
                    <KoCard
                      m={ko("sf", 2)}
                      nameOf={nameOf}
                      onClick={setDetail}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <H sm center>
                      3º e 4º lugar
                    </H>
                    <KoCard
                      m={ko("third")}
                      nameOf={nameOf}
                      onClick={setDetail}
                    />
                    <H sm center>
                      Final
                    </H>
                    <KoCard
                      m={ko("final")}
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
              <StatHead icon={<Trophy size={18} />} title="Melhores marcadores" />
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
                      barVal={p.goals}
                      barMax={scorers[0].goals}
                      last={i === scorers.length - 1}
                    />
                  ))}
                </Card>
              ) : (
                <EmptyLine text="Sem golos registados." />
              )}
            </div>
            <div>
              <StatHead
                icon={<Ball size={18} />}
                title="Melhor ataque"
                sub="Equipas com mais golos marcados"
              />
              {attack.length ? (
                <Card>
                  {attack.map((t, i) => (
                    <Row3
                      key={t.id}
                      i={i + 1}
                      name={t.name}
                      sub={t.ga + " sofridos"}
                      val={t.gf}
                      color={GREEN}
                      seed={t.id}
                      barVal={t.gf}
                      barMax={attack[0].gf}
                      extra={t.games + "J"}
                      last={i === attack.length - 1}
                    />
                  ))}
                </Card>
              ) : (
                <EmptyLine text="Sem jogos registados." />
              )}
            </div>
            <div>
              <StatHead
                icon={<Shield size={18} />}
                title="Melhor defesa"
                sub="Equipas com menos golos sofridos"
              />
              {defense.length ? (
                <Card>
                  {defense.map((t, i) => (
                    <Row3
                      key={t.id}
                      i={i + 1}
                      name={t.name}
                      sub={t.gf + " marcados"}
                      val={t.ga}
                      color="#2563eb"
                      seed={t.id}
                      barVal={defense[defense.length - 1].ga - t.ga}
                      barMax={defense[defense.length - 1].ga - defense[0].ga}
                      extra={t.games + "J"}
                      last={i === defense.length - 1}
                    />
                  ))}
                </Card>
              ) : (
                <EmptyLine text="Sem jogos registados." />
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
            install={install}
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
          boxShadow: "0 -2px 16px rgba(18,40,28,.07)",
          padding: "7px 4px",
          paddingBottom: "max(7px, env(safe-area-inset-bottom))",
        }}
      >
        {navBtn("standings", <List size={22} />, "Tabela")}
        {navBtn("live", <Broadcast size={22} />, "Ao Vivo", "#dc2626")}
        {navBtn("schedule", <Calendar size={22} />, "Calend.")}
        {navBtn("stats", <Chart size={22} />, "Estat.")}
        {navBtn("profile", <Info size={22} />, "Info")}
      </div>

      {rules && <Rules onClose={() => setRules(false)} />}
      {notifyOpen && (
        <NotifyModal
          notifyOn={on}
          supported={supported}
          onNotify={enable}
          onClose={() => setNotifyOpen(false)}
        />
      )}
      {detailMatch && (
        <MatchDetail
          m={detailMatch}
          state={state}
          onClose={() => setDetail(null)}
        />
      )}
      {detailTeam && (
        <TeamDetail
          team={detailTeam}
          state={state}
          onClose={() => setTeamId(null)}
          onMatch={(id) => {
            setTeamId(null);
            setDetail(id);
          }}
          onLive={() => {
            setTeamId(null);
            setTab("live");
          }}
        />
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        background: "#f4f6f3",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: "#eef5ef",
          color: GREEN,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "bob 1.1s ease-in-out infinite",
        }}
      >
        <Ball size={36} />
      </div>
      <div
        style={{
          width: 26,
          height: 26,
          border: "3px solid #e2e8e0",
          borderTopColor: GREEN,
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <div
        className="cond"
        style={{
          color: MUTED,
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        A carregar…
      </div>
    </div>
  );
}

function Header({
  name,
  title,
  sub,
  liveCount,
  notifyOn,
  onBell,
}: {
  name: string;
  title: string;
  sub: string;
  liveCount: number;
  notifyOn: boolean;
  onBell: () => void;
}) {
  const parts = name.trim().split(" ");
  const brandFirst = parts[0];
  const brandRest = parts.slice(1).join(" ");
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "#fff",
        paddingTop: "env(safe-area-inset-top)",
        borderBottom: `1px solid ${LINE}`,
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 13,
        }}
      >
        {/* espaço para o icon / logótipo do torneio */}
        <div
          style={{
            width: 46,
            height: 46,
            flexShrink: 0,
            borderRadius: 14,
            background: "#eef5ef",
            color: GREEN,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ball size={26} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10.5,
              color: GREEN,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            {title}
          </div>
          <div
            className="cond"
            style={{
              fontWeight: 800,
              fontSize: 27,
              color: INK,
              lineHeight: 1.05,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <span style={{ color: GREEN }}>{brandFirst}</span>
            {brandRest && " " + brandRest}
          </div>
          <div style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>
            {sub}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          {liveCount > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#fef2f2",
                color: "#dc2626",
                padding: "7px 11px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#dc2626",
                  animation: "pulse 1.1s infinite",
                }}
              />
              {liveCount} ao vivo
            </div>
          )}
          <button
            onClick={onBell}
            aria-label="Notificações"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              border: `1px solid ${notifyOn ? GREEN : "#e0e5df"}`,
              borderRadius: "50%",
              background: notifyOn ? GREEN : "#f1f4f0",
              color: notifyOn ? "#fff" : "#33403a",
              cursor: "pointer",
            }}
          >
            {notifyOn ? <Bell size={19} /> : <BellOff size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationsPanel({
  notifyOn,
  supported,
  onNotify,
}: {
  notifyOn: boolean;
  supported: boolean;
  onNotify: () => void;
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

  return (
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
          Este navegador não suporta notificações. No iPhone, adiciona primeiro o
          site ao ecrã principal (passos abaixo).
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
          <Check size={18} /> Notificações ativadas neste dispositivo.
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
            <div style={{ fontSize: 13.5, color: "#3a4a40", lineHeight: 1.5 }}>
              Toca em <b>«Ativar notificações»</b> aqui em cima e aceita o pedido
              do navegador. Está feito.
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
                No iPhone, o botão só funciona depois de adicionares o site ao
                ecrã principal:
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
                Toca no sino aqui em cima (ou no Perfil) e em{" "}
                <b>«Ativar notificações»</b>.
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

function NotifyModal({
  notifyOn,
  supported,
  onNotify,
  onClose,
}: {
  notifyOn: boolean;
  supported: boolean;
  onNotify: () => void;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(8,30,18,.55)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "18px 14px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 18,
          width: "100%",
          maxWidth: 460,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg,#0c2a1c,#15803d)",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff" }}>
            <Bell size={18} />
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
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "rgba(255,255,255,.2)",
              color: "#fff",
              width: 32,
              height: 32,
              borderRadius: 9,
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
        <NotificationsPanel
          notifyOn={notifyOn}
          supported={supported}
          onNotify={onNotify}
        />
      </div>
    </div>
  );
}

function FeedbackCard() {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (name.trim().length < 2) {
      setErr("Escreve o teu nome.");
      return;
    }
    if (msg.trim().length < 2) {
      setErr("Escreve uma mensagem.");
      return;
    }
    setSending(true);
    setErr("");
    try {
      const r = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), message: msg.trim() }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        setSent(true);
        setMsg("");
        setName("");
      } else setErr(d.error || "Não foi possível enviar.");
    } catch {
      setErr("Sem ligação. Tenta de novo.");
    }
    setSending(false);
  };

  return (
    <div className="soft-card" style={{ padding: "16px 16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span
          style={{
            width: 38,
            height: 38,
            flexShrink: 0,
            borderRadius: 11,
            background: "#eef5ef",
            color: GREEN,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Chat size={20} />
        </span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: INK }}>
            Deixa o teu comentário
          </div>
          <div style={{ fontSize: 12.5, color: MUTED }}>
            Feedback sobre o torneio, a app, o que quiseres.
          </div>
        </div>
      </div>

      {sent ? (
        <div
          style={{
            marginTop: 14,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            padding: "18px 12px",
            background: "#f3faf5",
            borderRadius: 12,
            textAlign: "center",
          }}
        >
          <span style={{ color: GREEN }}>
            <Check size={30} />
          </span>
          <div style={{ fontWeight: 700, color: INK }}>Obrigado pelo comentário!</div>
          <button
            onClick={() => setSent(false)}
            style={{
              border: `1px solid ${LINE}`,
              background: "#fff",
              color: "#5b7163",
              fontWeight: 600,
              fontSize: 13,
              padding: "8px 16px",
              borderRadius: 10,
            }}
          >
            Enviar outro
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (err) setErr("");
            }}
            placeholder="O teu nome"
            maxLength={60}
            style={{
              width: "100%",
              padding: "11px 13px",
              border: `1.5px solid ${LINE}`,
              borderRadius: 11,
              fontSize: 14.5,
              outline: "none",
            }}
          />
          <textarea
            value={msg}
            onChange={(e) => {
              setMsg(e.target.value);
              if (err) setErr("");
            }}
            placeholder="Escreve aqui o teu comentário…"
            rows={4}
            maxLength={600}
            style={{
              width: "100%",
              padding: "11px 13px",
              border: `1.5px solid ${LINE}`,
              borderRadius: 11,
              fontSize: 14.5,
              outline: "none",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
          {err && (
            <div style={{ color: "#dc2626", fontSize: 13, fontWeight: 600 }}>
              {err}
            </div>
          )}
          <button
            onClick={submit}
            disabled={sending}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              border: "none",
              background: GREEN,
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              padding: "12px",
              borderRadius: 11,
              opacity: sending ? 0.6 : 1,
              cursor: sending ? "default" : "pointer",
            }}
          >
            <Send size={17} />
            {sending ? "A enviar…" : "Enviar comentário"}
          </button>
        </div>
      )}
    </div>
  );
}

function IosInstall({ onClose }: { onClose: () => void }) {
  const step = (n: number, text: React.ReactNode, icon?: React.ReactNode) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span
        style={{
          width: 28,
          height: 28,
          flexShrink: 0,
          borderRadius: "50%",
          background: "#eef5ef",
          color: GREEN,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: 14,
        }}
      >
        {n}
      </span>
      <span style={{ flex: 1, fontSize: 14, color: INK, lineHeight: 1.4 }}>
        {text}
      </span>
      {icon && <span style={{ color: GREEN, display: "flex" }}>{icon}</span>}
    </div>
  );
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(8,30,18,.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "0 0 0",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          width: "100%",
          maxWidth: 520,
          padding: "20px 20px calc(24px + env(safe-area-inset-bottom))",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <span
            style={{
              width: 40,
              height: 40,
              flexShrink: 0,
              borderRadius: 12,
              background: "#eef5ef",
              color: GREEN,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Download size={21} />
          </span>
          <div style={{ flex: 1 }}>
            <div className="cond" style={{ fontWeight: 800, fontSize: 20, color: INK }}>
              Instalar no iPhone / iPad
            </div>
            <div style={{ fontSize: 12.5, color: MUTED }}>
              Em 3 passos, no Safari
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: `1px solid ${LINE}`,
              background: "#fff",
              color: "#5b7163",
              width: 32,
              height: 32,
              borderRadius: "50%",
              fontSize: 17,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          {step(
            1,
            <>
              Toca no botão <b>Partilhar</b> na barra do Safari
            </>,
            <Share size={20} />,
          )}
          {step(
            2,
            <>
              Escolhe <b>«Adicionar ao ecrã principal»</b>
            </>,
            <PlusSquare size={20} />,
          )}
          {step(
            3,
            <>
              Abre a app pelo novo <b>ícone</b> no ecrã principal
            </>,
          )}
        </div>
        <div
          style={{
            marginTop: 16,
            background: "#f6f8f5",
            border: `1px solid ${LINE}`,
            borderRadius: 11,
            padding: "10px 13px",
            fontSize: 12.5,
            color: "#5b6b62",
          }}
        >
          Tem de ser no <b>Safari</b> (não funciona no Chrome do iPhone). Precisa de iOS 16.4 ou superior para as notificações.
        </div>
      </div>
    </div>
  );
}

function Profile({
  notifyOn,
  supported,
  onNotify,
  onRules,
  install,
}: {
  notifyOn: boolean;
  supported: boolean;
  onNotify: () => void;
  onRules: () => void;
  install: InstallInfo;
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);
  const rowLink = (
    icon: React.ReactNode,
    label: string,
    onClick?: () => void,
    href?: string,
  ) => {
    const inner = (
      <>
        <span
          style={{
            width: 38,
            height: 38,
            flexShrink: 0,
            borderRadius: 11,
            background: "#eef5ef",
            color: GREEN,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </span>
        <span style={{ fontWeight: 600, fontSize: 15, color: INK }}>
          {label}
        </span>
        <span style={{ marginLeft: "auto", color: "#c4cdc6", display: "flex" }}>
          <Chevron size={20} />
        </span>
      </>
    );
    const base: React.CSSProperties = {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "13px 16px",
      background: "#fff",
      border: `1px solid ${LINE}`,
      borderRadius: 16,
      boxShadow: SOFT,
      textDecoration: "none",
      cursor: "pointer",
    };
    const external = !!href && /^https?:\/\//.test(href);
    return href ? (
      <a
        href={href}
        style={base}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
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
      {install.canShow && (
        <button
          onClick={() =>
            install.platform === "ios" ? setIosHelp(true) : install.promptInstall()
          }
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            background: GREEN,
            border: "none",
            borderRadius: 16,
            boxShadow: SOFT,
            cursor: "pointer",
            textAlign: "left",
            color: "#fff",
          }}
        >
          <span
            style={{
              width: 40,
              height: 40,
              flexShrink: 0,
              borderRadius: 12,
              background: "rgba(255,255,255,.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Download size={21} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontWeight: 700, fontSize: 15 }}>
              Instalar a app
            </span>
            <span style={{ display: "block", fontSize: 12.5, color: "#dcfce7" }}>
              {install.platform === "ios"
                ? "Adiciona ao ecrã principal do iPhone/iPad"
                : "Acesso rápido e notificações no telemóvel"}
            </span>
          </span>
          <span style={{ color: "rgba(255,255,255,.85)", display: "flex" }}>
            <Chevron size={20} />
          </span>
        </button>
      )}
      {iosHelp && <IosInstall onClose={() => setIosHelp(false)} />}
      {rowLink(<Document size={20} />, "Regulamento do torneio", onRules)}
      {rowLink(<MapPin size={20} />, "Localização do campo", undefined, "https://maps.app.goo.gl/oJx5AAZUgf63vpT77")}

      <div
        className="soft-card"
        style={{
          padding: "13px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            width: 38,
            height: 38,
            flexShrink: 0,
            borderRadius: 11,
            background: "#eef5ef",
            color: GREEN,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <User size={20} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: INK }}>
            Organizador do torneio
          </div>
          <div style={{ fontSize: 13, color: MUTED }}>Ricardo Cunha</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a
            href="https://wa.me/351911103505"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#25d366",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13.5,
              padding: "9px 14px",
              borderRadius: 10,
              textDecoration: "none",
            }}
          >
            WhatsApp
          </a>
          <a
            href="sms:+351911103505"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#eef2ec",
              color: DGREEN,
              fontWeight: 700,
              fontSize: 13.5,
              padding: "9px 14px",
              borderRadius: 10,
              textDecoration: "none",
            }}
          >
            SMS
          </a>
        </div>
      </div>

      {/* Notificações — colapsável */}
      <div className="soft-card" style={{ overflow: "hidden" }}>
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          style={{
            width: "100%",
            background: "#fff",
            padding: "13px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            border: "none",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span
            style={{
              width: 38,
              height: 38,
              flexShrink: 0,
              borderRadius: 11,
              background: notifyOn ? GREEN : "#eef5ef",
              color: notifyOn ? "#fff" : GREEN,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bell size={19} />
          </span>
          <span style={{ fontWeight: 600, fontSize: 15, color: INK }}>
            Notificações
          </span>
          <span
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: notifyOn ? GREEN : MUTED,
              }}
            >
              {notifyOn ? "Ativadas" : "Desativadas"}
            </span>
            <span
              style={{
                color: "#c4cdc6",
                display: "inline-flex",
                transform: notifOpen ? "rotate(90deg)" : "none",
                transition: "transform .15s",
              }}
            >
              <Chevron size={18} />
            </span>
          </span>
        </button>
        {notifOpen && (
          <NotificationsPanel
            notifyOn={notifyOn}
            supported={supported}
            onNotify={onNotify}
          />
        )}
      </div>

      <FeedbackCard />

      {rowLink(<Shield size={20} />, "Backoffice", undefined, "/admin")}
    </div>
  );
}

function GroupCard({ g, state, onTeam }: { g: string; state: TournamentState; onTeam: (id: string) => void }) {
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
  const cols = "24px 1fr 18px 40px 30px 26px 22px";
  const head = {
    display: "grid",
    gridTemplateColumns: cols,
    columnGap: 0,
    alignItems: "center",
  } as const;
  const num = (v: React.ReactNode, extra?: React.CSSProperties) => (
    <span style={{ textAlign: "center", color: MUTED, fontSize: 13, ...extra }}>{v}</span>
  );
  return (
    <div className="soft-card" style={{ overflow: "hidden" }}>
      <div
        style={{
          padding: "13px 18px",
          borderBottom: `1px solid ${LINE}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span className="cond" style={{ fontWeight: 800, fontSize: 19, color: INK }}>
          Grupo {g}
        </span>
        <span style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>
          {rows.length} equipas
        </span>
      </div>
      <div style={{ padding: "4px 14px 10px" }}>
        <div
          className="stand-grid"
          style={{
            ...head,
            padding: "10px 4px 8px",
            fontSize: 11,
            fontWeight: 700,
            color: MUTED,
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}
        >
          <span style={{ textAlign: "center" }}>#</span>
          <span>Equipa</span>
          <span style={{ textAlign: "center" }}>J</span>
          <span style={{ textAlign: "center" }}>V/E/D</span>
          <span style={{ textAlign: "center" }}>G</span>
          <span style={{ textAlign: "center" }}>DG</span>
          <span style={{ textAlign: "center" }}>P</span>
        </div>
        {rows.map((r, i) => {
          const dg = r.GF - r.GA;
          const playoff = i < 2;
          const isLive = liveIds.has(r.team.id);
          return (
            <div
              key={r.team.id}
              className="stand-grid"
              onClick={() => onTeam(r.team.id)}
              role="button"
              title="Ver ficha da equipa"
              style={{
                ...head,
                padding: "8px 4px",
                borderTop: i === 0 ? "none" : `1px solid #f3f5f1`,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  margin: "0 auto",
                  borderRadius: 7,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 12,
                  background: playoff ? GREEN : "#eef1ee",
                  color: playoff ? "#fff" : "#7c8a82",
                }}
              >
                {i + 1}
              </span>
              <div
                className="tcell"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minWidth: 0,
                  paddingRight: 10,
                }}
              >
                <span className="tbadge" style={{ display: "inline-flex", marginLeft: 6 }}>
                  <TeamBadge name={r.team.name} seed={r.team.id} size={26} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: INK,
                      display: "block",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.team.name}
                  </span>
                  {isLive && (
                    <span
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
                    </span>
                  )}
                </div>
              </div>
              {num(r.P)}
              {num(`${r.W}/${r.D}/${r.L}`, { fontSize: 12.5 })}
              {num(`${r.GF}/${r.GA}`, { fontSize: 12.5 })}
              {num((dg > 0 ? "+" : "") + dg, {
                fontWeight: 600,
                color: dg > 0 ? GREEN : dg < 0 ? "#dc2626" : MUTED,
              })}
              <span
                className="cond pts"
                style={{ textAlign: "center", fontWeight: 800, color: INK }}
              >
                {r.Pts}
              </span>
            </div>
          );
        })}
      </div>
      {rows.length > 0 && (
        <div
          style={{
            padding: "10px 18px",
            borderTop: `1px solid ${LINE}`,
            fontSize: 11.5,
            color: MUTED,
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 3,
              background: GREEN,
              flexShrink: 0,
            }}
          />
          1.º e 2.º apuram-se para a fase final
        </div>
      )}
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
  const sa = scoreOf(m, m.a),
    sb = scoreOf(m, m.b);
  return (
    <div
      onClick={onClick}
      className="soft-card"
      style={{
        padding: "12px 14px",
        display: "flex",
        alignItems: "stretch",
        gap: 14,
        cursor: "pointer",
        borderColor: "#f6d5d5",
      }}
    >
      <div
        style={{
          width: 60,
          flexShrink: 0,
          borderRight: `1px solid ${LINE}`,
          paddingRight: 13,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          textAlign: "center",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10.5,
            fontWeight: 800,
            color: half ? "#d97706" : "#dc2626",
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: half ? "#d97706" : "#dc2626",
              animation: "pulse 1.1s infinite",
            }}
          />
          {half ? "Intervalo" : "Ao Vivo"}
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: MUTED }}>
          {liveText(m)}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 9 }}>
        <TeamLine name={nameOf(m, "a")} seed={m.a || "a"} val={sa} winner={sa > sb} />
        <TeamLine name={nameOf(m, "b")} seed={m.b || "b"} val={sb} winner={sb > sa} />
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
    side: "a" | "b",
    score: number,
    win: boolean,
    pending: boolean,
  ) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "11px 14px",
      }}
    >
      {pending ? (
        <span
          style={{
            width: 26,
            height: 26,
            flexShrink: 0,
            borderRadius: "50%",
            background: "#f0f3ef",
          }}
        />
      ) : (
        <TeamBadge name={name} seed={m[side] || side} size={26} />
      )}
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontWeight: win ? 700 : 500,
          fontSize: 14.5,
          color: pending ? "#a7b3ab" : INK,
          fontStyle: pending ? "italic" : "normal",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {name}
      </span>
      {win && <Trophy size={15} color="#ca8a04" />}
      <span
        className="cond"
        style={{ fontWeight: 800, fontSize: 19, color: INK, flexShrink: 0 }}
      >
        {m.status === "scheduled" ? "–" : score}
      </span>
    </div>
  );
  return (
    <div
      onClick={() => onClick(m.id)}
      className="soft-card"
      style={{ overflow: "hidden", cursor: "pointer" }}
    >
      {(m.date || m.time) && (
        <div
          style={{
            padding: "7px 14px",
            borderBottom: `1px solid ${LINE}`,
            fontSize: 12,
            fontWeight: 700,
            color: MUTED,
            textAlign: "center",
          }}
        >
          {[fmtDate(m.date), m.time].filter(Boolean).join(" · ")}
        </div>
      )}
      {cell(nameOf(m, "a"), "a", sa, aw, !m.a)}
      <div style={{ height: 1, background: LINE, margin: "0 14px" }} />
      {cell(nameOf(m, "b"), "b", sb, bw, !m.b)}
      {m.status === "live" && (
        <div
          style={{
            background: m.livePhase === "half" ? "#d97706" : "#dc2626",
            padding: "5px 14px",
            fontSize: 11,
            fontWeight: 800,
            color: "#fff",
            textAlign: "center",
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
        fontWeight: 800,
        fontSize: 19,
        color: INK,
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
// linha de uma equipa dentro de um card de jogo (badge + nome + resultado)
function TeamLine({
  name,
  seed,
  val,
  winner,
}: {
  name: string;
  seed: string;
  val?: number;
  winner?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <TeamBadge name={name} seed={seed} size={26} />
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontWeight: winner ? 700 : 500,
          fontSize: 14.5,
          color: INK,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {name}
      </span>
      <span
        className="cond"
        style={{
          fontWeight: 800,
          fontSize: 18,
          color: val === undefined ? "#c4cdc6" : INK,
          flexShrink: 0,
        }}
      >
        {val === undefined ? "–" : val}
      </span>
    </div>
  );
}

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
  const sa = scoreOf(m, m.a),
    sb = scoreOf(m, m.b);
  const date = fmtDate(m.date);
  return (
    <div
      onClick={onClick}
      className="soft-card"
      style={{
        padding: "12px 14px",
        display: "flex",
        alignItems: "stretch",
        gap: 14,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div
        style={{
          width: 54,
          flexShrink: 0,
          borderRight: `1px solid ${LINE}`,
          paddingRight: 13,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          textAlign: "center",
        }}
      >
        {score ? (
          <>
            <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>
              {date || "—"}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>
              Final
            </span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 15, fontWeight: 800, color: INK }}>
              {m.time || "—"}
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: MUTED }}>
              {date}
            </span>
          </>
        )}
        {m.phase === "friendly" && (
          <span style={{ fontSize: 9, fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", marginTop: 2 }}>
            Amigável
          </span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 9 }}>
        <TeamLine
          name={nameOf(m, "a")}
          seed={m.a || "a"}
          val={score ? sa : undefined}
          winner={score && sa > sb}
        />
        <TeamLine
          name={nameOf(m, "b")}
          seed={m.b || "b"}
          val={score ? sb : undefined}
          winner={score && sb > sa}
        />
      </div>
    </div>
  );
}

const StatHead = ({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
}) => (
  <div style={{ margin: "0 0 12px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          width: 32,
          height: 32,
          flexShrink: 0,
          borderRadius: 10,
          background: "#eef5ef",
          color: GREEN,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </span>
      <span
        className="cond"
        style={{ fontWeight: 800, fontSize: 20, color: INK, flex: 1 }}
      >
        {title}
      </span>
      <span
        style={{
          fontWeight: 700,
          fontSize: 11,
          color: GREEN,
          background: "#eef5ef",
          padding: "3px 9px",
          borderRadius: 999,
        }}
      >
        Top 5
      </span>
    </div>
    {sub && (
      <div style={{ fontSize: 12.5, color: MUTED, margin: "6px 0 0 42px" }}>
        {sub}
      </div>
    )}
  </div>
);
const H = ({
  children,
  sm,
  center,
}: {
  children: React.ReactNode;
  sm?: boolean;
  center?: boolean;
}) => (
  <div
    className="cond"
    style={{
      fontWeight: 800,
      fontSize: sm ? 16 : 22,
      color: DGREEN,
      textTransform: "uppercase",
      textAlign: center ? "center" : "left",
      margin: center ? 0 : sm ? "0 0 10px" : "0 0 12px",
    }}
  >
    {children}
  </div>
);
const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="soft-card" style={{ overflow: "hidden" }}>{children}</div>
);
const Row3 = ({
  i,
  name,
  sub,
  val,
  color,
  extra,
  seed,
  barVal,
  barMax,
  last,
}: {
  i: number;
  name: string;
  sub: string;
  val: number;
  color: string;
  extra?: string;
  seed?: string;
  barVal?: number;
  barMax?: number;
  last?: boolean;
}) => {
  const pct =
    barMax && barMax > 0
      ? Math.max(6, Math.min(100, ((barVal ?? val) / barMax) * 100))
      : 0;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: seed ? "20px 30px 1fr auto" : "20px 1fr auto",
        alignItems: "center",
        gap: 11,
        padding: "11px 16px",
        borderTop: i === 1 ? "none" : `1px solid #f3f5f1`,
        borderBottom: last ? `1px solid ${LINE}` : undefined,
      }}
    >
      <span
        style={{
          fontWeight: 700,
          fontSize: 13,
          color: i <= 3 ? color : MUTED,
          textAlign: "center",
        }}
      >
        {i}
      </span>
      {seed && <TeamBadge name={name} seed={seed} size={28} />}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: INK,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </div>
        {pct > 0 ? (
          <div
            style={{
              marginTop: 5,
              height: 5,
              borderRadius: 999,
              background: "#eef1ee",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: pct + "%",
                height: "100%",
                borderRadius: 999,
                background: color,
              }}
            />
          </div>
        ) : (
          <div style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>{sub}</div>
        )}
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <span className="cond" style={{ fontWeight: 800, fontSize: 20, color: INK }}>
          {val}
        </span>
        {extra && (
          <div style={{ fontSize: 10.5, color: MUTED, fontWeight: 600 }}>
            {extra}
          </div>
        )}
      </div>
    </div>
  );
};
const Empty = ({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
}) => (
  <div style={{ textAlign: "center", padding: "70px 20px", color: MUTED }}>
    <div
      style={{
        marginBottom: 14,
        display: "flex",
        justifyContent: "center",
        color: "#c4cfc6",
      }}
    >
      {icon}
    </div>
    <div style={{ fontSize: 17, fontWeight: 600, color: "#5b6b62" }}>{title}</div>
    {sub && <div style={{ fontSize: 14, marginTop: 4 }}>{sub}</div>}
  </div>
);
const EmptyLine = ({ text }: { text: string }) => (
  <div
    className="soft-card"
    style={{
      padding: 24,
      textAlign: "center",
      color: MUTED,
      fontSize: 14,
    }}
  >
    {text}
  </div>
);
