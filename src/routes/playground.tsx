import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Phone, PhoneOff, Loader2, Settings2, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Room, RoomEvent, Track, createLocalAudioTrack, ConnectionState } from "livekit-client";
import { agentsApi } from "@/lib/api";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/playground")({
  head: () => ({
    meta: [
      { title: "Voice Playground — VoxSales AI" },
      { name: "description", content: "Talk directly to your AI sales agent using your microphone." },
    ],
  }),
  component: PlaygroundPage,
});

type CallState = "idle" | "connecting" | "connected" | "disconnecting";

/* ── Audio bars visualiser ─────────────────────────────────────────────────── */
function AudioBars({ active, count = 7 }: { active: boolean; count?: number }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-8">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={cn("block w-[3px] rounded-full transition-all duration-300", active ? "bg-emerald-400" : "bg-white/20")}
          style={{
            height: active ? undefined : "5px",
            animation: active ? `voiceBar 0.8s ease-in-out ${i * 0.11}s infinite alternate` : "none",
          }}
        />
      ))}
    </div>
  );
}

/* ── Pulsing ring ──────────────────────────────────────────────────────────── */
function PulseRing({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <>
      <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
      <span className="absolute inset-0 rounded-full bg-emerald-500/15 animate-ping" style={{ animationDelay: "0.4s" }} />
    </>
  );
}

/* ── Call timer ────────────────────────────────────────────────────────────── */
function CallTimer({ running }: { running: boolean }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    setSecs(0);
    if (!running) return;
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return <span className="text-sm tabular-nums text-white/60">{m}:{s}</span>;
}

/* ── Main component ────────────────────────────────────────────────────────── */
function PlaygroundPage() {
  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: () => agentsApi.list(),
    staleTime: 60_000,
  });

  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const localTrackRef = useRef<ReturnType<typeof createLocalAudioTrack> extends Promise<infer T> ? T : never | null>(null as any);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  useEffect(() => {
    if (agents[0] && !selectedAgentId) setSelectedAgentId(agents[0].id);
  }, [agents, selectedAgentId]);

  useEffect(() => () => { void doHangUp(); }, []);

  const startVAD = useCallback((track: { mediaStreamTrack: MediaStreamTrack }) => {
    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const src = ctx.createMediaStreamSource(new MediaStream([track.mediaStreamTrack]));
      src.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(buf);
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
        setIsUserSpeaking(avg > 12);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch { /* no-op */ }
  }, []);

  const stopVAD = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setIsUserSpeaking(false);
  }, []);

  async function doHangUp() {
    setCallState("disconnecting");
    stopVAD();
    (localTrackRef.current as any)?.stop?.();
    localTrackRef.current = null as any;
    await roomRef.current?.disconnect();
    roomRef.current = null;
    document.querySelectorAll("audio[data-lk-auto]").forEach((el) => el.remove());
    setCallState("idle");
    setIsAgentSpeaking(false);
    setIsMuted(false);
  }

  async function startCall() {
    if (!selectedAgentId) { toast.error("Select an agent first"); return; }
    setCallState("connecting");
    try {
      const { token, ws_url } = await api.post<{ token: string; ws_url: string; room: string }>(
        "/telephony/playground-session",
        { agent_id: selectedAgentId }
      );

      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          const el = track.attach();
          el.dataset.lkAuto = "1";
          el.style.display = "none";
          document.body.appendChild(el);
        }
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        setIsAgentSpeaking(speakers.some((p) => !p.isLocal));
      });

      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        if (state === ConnectionState.Disconnected) {
          setCallState("idle");
          setIsAgentSpeaking(false);
          stopVAD();
        }
      });

      await room.connect(ws_url, token);

      const localTrack = await createLocalAudioTrack({ echoCancellation: true, noiseSuppression: true });
      localTrackRef.current = localTrack as any;
      await room.localParticipant.publishTrack(localTrack);
      startVAD(localTrack as any);
      setCallState("connected");
    } catch (err: any) {
      toast.error("Could not connect", { description: err?.message });
      setCallState("idle");
    }
  }

  function toggleMute() {
    const t = localTrackRef.current as any;
    if (!t) return;
    if (isMuted) { t.unmute?.(); setIsMuted(false); }
    else { t.mute?.(); setIsMuted(true); }
  }

  const isConnected = callState === "connected";
  const isConnecting = callState === "connecting";
  const agentName = selectedAgent?.name ?? "AI Agent";

  return (
    <>
      {/* keyframe injected inline so no Tailwind plugin needed */}
      <style>{`
        @keyframes voiceBar { from { height: 4px; } to { height: 28px; } }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 80px)", padding: "1rem" }}>
        {/* ── Glass card ── */}
        <div style={{
          position: "relative",
          width: "100%",
          maxWidth: "360px",
          borderRadius: "24px",
          overflow: "hidden",
          background: "linear-gradient(145deg, #0f172a 0%, #1e293b 60%, #0f2240 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
        }}>
          {/* top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px 8px" }}>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Voice Playground
            </span>
            {isConnected && <CallTimer running />}
          </div>

          {/* avatar area */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 20px 16px", gap: "12px" }}>
            <div style={{ position: "relative" }}>
              <PulseRing active={isAgentSpeaking} />
              <div style={{
                position: "relative",
                zIndex: 10,
                width: 96,
                height: 96,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.2rem",
                fontWeight: 700,
                color: "white",
                background: isConnected
                  ? "linear-gradient(135deg, #10b981 0%, #0d9488 100%)"
                  : "linear-gradient(135deg, #475569 0%, #334155 100%)",
                boxShadow: isConnected ? "0 0 32px rgba(16,185,129,0.35)" : "none",
                transition: "all 0.4s ease",
                userSelect: "none",
              }}>
                {agentName.charAt(0).toUpperCase()}
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "white" }}>{agentName}</p>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.45)" }}>
                {isConnecting && "Connecting…"}
                {isConnected && (isAgentSpeaking ? "Speaking…" : "Listening…")}
                {callState === "idle" && "Press to start"}
                {callState === "disconnecting" && "Ending call…"}
              </p>
            </div>

            <AudioBars active={isAgentSpeaking} />
          </div>

          {/* agent picker (idle only) */}
          {callState === "idle" && (
            <div style={{ margin: "0 16px 16px" }}>
              <button
                onClick={() => setShowPicker((v) => !v)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.75)",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Settings2 size={14} style={{ opacity: 0.5 }} />
                  {agentsLoading ? "Loading…" : (selectedAgent?.name ?? "Select agent")}
                </span>
                <ChevronDown size={14} style={{ opacity: 0.5, transform: showPicker ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>

              {showPicker && agents.length > 0 && (
                <div style={{
                  marginTop: 6,
                  borderRadius: 14,
                  overflow: "hidden",
                  background: "rgba(15,23,42,0.97)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}>
                  {agents.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => { setSelectedAgentId(a.id); setShowPicker(false); }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 14px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: a.id === selectedAgentId ? "#34d399" : "rgba(255,255,255,0.65)",
                        fontWeight: a.id === selectedAgentId ? 600 : 400,
                        fontSize: "0.85rem",
                      }}
                    >
                      {a.name}
                      {a.industry && <span style={{ marginLeft: 6, fontSize: "0.75rem", opacity: 0.4 }}>· {a.industry}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* mic status bar (connected) */}
          {isConnected && (
            <div style={{
              margin: "0 16px 12px",
              padding: "8px 14px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: isMuted ? "#ef4444" : isUserSpeaking ? "#34d399" : "rgba(255,255,255,0.2)",
                boxShadow: isUserSpeaking && !isMuted ? "0 0 8px #34d399" : "none",
                transition: "all 0.2s",
                flexShrink: 0,
              }} />
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)" }}>
                {isMuted ? "Microphone muted" : isUserSpeaking ? "You're speaking" : "Mic is on"}
              </span>
            </div>
          )}

          {/* ── Controls row — centred ── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            padding: "12px 20px 28px",
          }}>
            {/* Mute (only when connected) */}
            {isConnected ? (
              <button
                onClick={toggleMute}
                style={{
                  width: 52, height: 52, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isMuted ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)",
                  border: `1px solid ${isMuted ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`,
                  color: isMuted ? "#f87171" : "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            ) : (
              /* spacer to keep phone button centered when no mute button */
              <div style={{ width: 52, height: 52, flexShrink: 0 }} />
            )}

            {/* Main phone button */}
            <button
              onClick={isConnected ? doHangUp : startCall}
              disabled={isConnecting || callState === "disconnecting" || (!selectedAgentId && callState === "idle")}
              style={{
                width: 76, height: 76, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isConnected ? "#ef4444" : "#10b981",
                boxShadow: isConnected ? "0 0 24px rgba(239,68,68,0.4)" : "0 0 24px rgba(16,185,129,0.45)",
                border: "none",
                cursor: (isConnecting || callState === "disconnecting") ? "not-allowed" : "pointer",
                opacity: (isConnecting || callState === "disconnecting") ? 0.7 : 1,
                transition: "all 0.25s",
                flexShrink: 0,
              }}
            >
              {isConnecting
                ? <Loader2 size={28} color="white" style={{ animation: "spin 1s linear infinite" }} />
                : isConnected
                  ? <PhoneOff size={28} color="white" />
                  : <Phone size={28} color="white" />
              }
            </button>

            {/* Spacer for symmetry when connected (mute button is on left) */}
            {isConnected ? (
              <div style={{ width: 52, height: 52, flexShrink: 0 }} />
            ) : (
              <div style={{ width: 52, height: 52, flexShrink: 0 }} />
            )}
          </div>

          {/* footer hint */}
          <p style={{ textAlign: "center", paddingBottom: 18, margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.18)" }}>
            {isConnected ? "Real-time voice · LiveKit WebRTC" : "Press the green button to start"}
          </p>
        </div>

        {/* agent info below card */}
        {selectedAgent && callState === "idle" && (
          <div style={{ marginTop: 14, display: "flex", gap: 16, fontSize: "0.75rem", color: "rgba(100,100,120,0.8)" }}>
            {selectedAgent.tone && <span>Tone: <b style={{ color: "rgba(140,140,160,1)" }}>{selectedAgent.tone}</b></span>}
            {selectedAgent.industry && <span>Industry: <b style={{ color: "rgba(140,140,160,1)" }}>{selectedAgent.industry}</b></span>}
          </div>
        )}
      </div>
    </>
  );
}
