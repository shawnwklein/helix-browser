import { useEffect, useRef, useState } from "react";
import {
  FACE_BAR_VISIBLE,
  FACE_ROLES,
  faceArrivesFromOverflow,
  faceSwitchChord,
  faceSwitchChordCompact,
  facesDepartToOverflow,
  normalizeFaceName,
  overflowFaces,
  overflowMoreOpen,
  overflowMoreTitle,
  overflowRecedeKicker,
  overflowRowLeaves,
  overflowRowSettles,
  overflowSheetExits,
  overflowSheetHoldMs,
  overflowSheetRows,
} from "../lib/faces";
import { activeFace, faceOf, useHelix } from "../store";

export function FaceBar() {
  const s = useHelix();
  const current = activeFace(s);
  const currentChord =
    s.faces.length > 1
      ? faceSwitchChord(s.faces.findIndex((f) => f.id === s.activeFaceId))
      : null;
  const { shown, overflow } = overflowFaces(s.faces, s.activeFaceId, FACE_BAR_VISIBLE);
  const [menu, setMenu] = useState<"outlook" | "add" | "overflow" | string | null>(null);
  const [rename, setRename] = useState("");
  const [stayTick, setStayTick] = useState(0);
  const [overflowExit, setOverflowExit] = useState(false);
  const [latch, setLatch] = useState({
    pulse: s.faceStayPulse,
    faceId: s.activeFaceId,
    arrivePulse: 0,
    settlePulse: 0,
    settleIds: [] as string[],
    leaveIds: [] as string[],
  });
  if (latch.pulse !== s.faceStayPulse || latch.faceId !== s.activeFaceId) {
    const pulseChanged = latch.pulse !== s.faceStayPulse;
    const arrivingNow =
      pulseChanged &&
      faceArrivesFromOverflow(s.faces, latch.faceId, s.activeFaceId);
    const departing = arrivingNow
      ? facesDepartToOverflow(s.faces, latch.faceId, s.activeFaceId).map((f) => f.id)
      : [];
    setLatch({
      pulse: s.faceStayPulse,
      faceId: s.activeFaceId,
      arrivePulse: arrivingNow
        ? s.faceStayPulse
        : pulseChanged
          ? 0
          : latch.arrivePulse,
      settlePulse:
        arrivingNow && departing.length
          ? s.faceStayPulse
          : pulseChanged
            ? 0
            : latch.settlePulse,
      settleIds:
        arrivingNow && departing.length
          ? departing
          : pulseChanged
            ? []
            : latch.settleIds,
      leaveIds: arrivingNow
        ? [s.activeFaceId]
        : pulseChanged
          ? []
          : latch.leaveIds,
    });
  }
  const wrap = useRef<HTMLDivElement>(null);
  const overflowHoldRef = useRef(0);

  const namerOpen = menu === "add" || s.faceNamerOpen;
  const outlookOpen = menu === "outlook" || s.outlookPickerOpen;
  const overflowOpen = menu === "overflow";

  const closeMenus = () => {
    setMenu(null);
    useHelix.getState().setFaceNamerOpen(false);
    useHelix.getState().setOutlookPickerOpen(false);
  };

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) {
        setMenu(null);
        useHelix.getState().setFaceNamerOpen(false);
        useHelix.getState().setOutlookPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!namerOpen && !outlookOpen && !overflowOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setMenu(null);
      useHelix.getState().setFaceNamerOpen(false);
      useHelix.getState().setOutlookPickerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [namerOpen, outlookOpen, overflowOpen]);

  useEffect(() => {
    if (menu === "overflow") return;
    if (overflowHoldRef.current) {
      window.clearTimeout(overflowHoldRef.current);
      overflowHoldRef.current = 0;
    }
    setOverflowExit(false);
  }, [menu]);

  useEffect(() => {
    return () => {
      if (overflowHoldRef.current) window.clearTimeout(overflowHoldRef.current);
    };
  }, []);

  useEffect(() => {
    if (!s.outlookPickerOpen) return;
    setMenu("outlook");
  }, [s.outlookPickerOpen]);

  useEffect(() => {
    if (!s.faceStayPulse) return;
    setStayTick(0);
    const frame = requestAnimationFrame(() => setStayTick(s.faceStayPulse));
    const t = window.setTimeout(() => setStayTick(0), 480);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(t);
    };
  }, [s.faceStayPulse]);

  const staying = stayTick > 0;
  const arriving = staying && latch.arrivePulse === s.faceStayPulse && latch.arrivePulse > 0;
  const settling =
    staying &&
    latch.settlePulse === s.faceStayPulse &&
    latch.settlePulse > 0 &&
    latch.settleIds.length > 0;
  const overflowSettleIds = overflowRowSettles(
    overflowOpen,
    settling ? latch.settleIds : [],
  );
  const overflowLeaveIds = overflowRowLeaves(
    overflowOpen,
    arriving ? latch.leaveIds : [],
  );
  const sheetRows = overflowSheetRows(
    overflowOpen,
    overflow,
    s.faces.filter((f) => overflowLeaveIds.includes(f.id)),
  );
  const recedeKicker = overflowRecedeKicker(
    overflowOpen,
    settling ? s.faces.filter((f) => latch.settleIds.includes(f.id)) : [],
  );

  const holdOverflowForLeave = (nextId: string) => {
    const holdOpts = {
      sheetOpen: overflowOpen,
      via: "click" as const,
      arrives: faceArrivesFromOverflow(s.faces, s.activeFaceId, nextId),
      sameId: nextId === s.activeFaceId,
    };
    const hold = overflowSheetHoldMs(holdOpts);
    if (overflowHoldRef.current) {
      window.clearTimeout(overflowHoldRef.current);
      overflowHoldRef.current = 0;
    }
    setOverflowExit(overflowSheetExits(holdOpts));
    if (hold <= 0) {
      setMenu(null);
      return;
    }
    overflowHoldRef.current = window.setTimeout(() => {
      overflowHoldRef.current = 0;
      setMenu((m) => (m === "overflow" ? null : m));
    }, hold);
  };

  return (
    <div className="faces" ref={wrap}>
      {shown.map((f) => {
        const i = s.faces.findIndex((x) => x.id === f.id);
        const chord = faceSwitchChord(i);
        const compact = faceSwitchChordCompact(i);
        const on = f.id === s.activeFaceId;
        return (
          <button
            key={on && staying ? `${f.id}-stay-${stayTick}${arriving ? "-arrive" : ""}` : f.id}
            className={`face-pill${on ? " on" : ""}${on && staying ? " stay" : ""}${on && staying && arriving ? " arrive" : ""}`}
            style={{ ["--face" as string]: f.color }}
            title={`${f.name}${f.hint ? ` · ${f.hint}` : ""}${chord ? `  ${chord}` : ""}`}
            onClick={() => s.setActiveFace(f.id)}
            onDoubleClick={() => s.openFaceHome(f.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              setRename(f.name);
              setMenu(f.id);
            }}
          >
            <i className="face-dot" />
            <span className="face-name">{f.name}</span>
            {s.faces.length > 1 && chord && compact ? (
              <kbd className={`face-chord hide-narrow${on ? "" : " compact"}`}>
                {on ? chord : compact}
              </kbd>
            ) : null}
            {f.kind.startsWith("outlook") && <span className="face-mail">@</span>}
          </button>
        );
      })}

      {overflow.length > 0 && (
        <button
          key={settling ? `more-settle-${stayTick}` : "more"}
          className={`face-pill face-more${overflowMoreOpen(overflowOpen, overflowExit) ? " open" : ""}${overflowExit ? " exit" : ""}${settling ? " settle" : ""}`}
          title={overflowMoreTitle(overflow)}
          onClick={() => {
            s.setFaceNamerOpen(false);
            s.setOutlookPickerOpen(false);
            setMenu(overflowOpen ? null : "overflow");
          }}
        >
          <span className="face-more-who" aria-hidden="true">
            {overflow.map((f) => (
              <i
                key={settling && latch.settleIds.includes(f.id) ? `${f.id}-settle-${stayTick}` : f.id}
                className={`face-dot${settling && latch.settleIds.includes(f.id) ? " settle" : ""}`}
                style={{ ["--face" as string]: f.color }}
              />
            ))}
          </span>
          {overflow.length} more
        </button>
      )}

      <div className="face-actions">
        <button
          className={`outlook-add${outlookOpen ? " on" : ""}`}
          title="Add another Outlook account — isolated cookies, same window"
          onClick={() => {
            s.setFaceNamerOpen(false);
            if (outlookOpen) {
              setMenu(null);
              s.setOutlookPickerOpen(false);
            } else {
              setMenu("outlook");
            }
          }}
        >
          + Outlook
        </button>
        <button
          className={`ico${namerOpen ? " on" : ""}`}
          title="Name a new Face"
          onClick={() => {
            if (namerOpen) closeMenus();
            else {
              s.setFaceNamerOpen(false);
              s.setOutlookPickerOpen(false);
              setMenu("add");
            }
          }}
        >
          +
        </button>
      </div>

      {(menu === "outlook" || s.outlookPickerOpen) && !s.faceNamerOpen && (
        <div className="face-menu">
          <div className="pane-kicker">A locked identity</div>
          <p>
            Each Outlook Face is its own Chromium profile. Work and personal
            Microsoft accounts never share cookies — and they stay in this
            window.
          </p>
          <button
            className="pal-item"
            onClick={() => {
              s.addOutlook("outlook-work");
              setMenu(null);
              s.setOutlookPickerOpen(false);
            }}
          >
            Work or school
            <kbd>office.com</kbd>
          </button>
          <button
            className="pal-item"
            onClick={() => {
              s.addOutlook("outlook-personal");
              setMenu(null);
              s.setOutlookPickerOpen(false);
            }}
          >
            Personal Microsoft
            <kbd>live.com</kbd>
          </button>
        </div>
      )}

      {namerOpen && <FaceNamer onClose={closeMenus} />}

      {overflowOpen && sheetRows.length > 0 && !s.faceNamerOpen && !s.outlookPickerOpen && (
        <div className={`face-menu face-overflow${overflowExit ? " exit" : ""}`}>
          <div
            key={recedeKicker ? `recede-${stayTick}` : "idle"}
            className={`pane-kicker${recedeKicker ? " recede" : ""}`}
          >
            {recedeKicker || "Also in this window"}
          </div>
          {sheetRows.map((f) => {
            const i = s.faces.findIndex((x) => x.id === f.id);
            const chord = faceSwitchChord(i);
            const compact = faceSwitchChordCompact(i);
            const rowLeaving = overflowLeaveIds.includes(f.id);
            const rowSettling = overflowSettleIds.includes(f.id);
            return (
              <button
                key={
                  rowLeaving
                    ? `${f.id}-leave-${stayTick}`
                    : rowSettling
                      ? `${f.id}-settle-${stayTick}`
                      : f.id
                }
                className={`face-overflow-row${rowLeaving ? " leave" : rowSettling ? " settle" : ""}`}
                style={{ ["--face" as string]: f.color }}
                title={`${f.name}${f.hint ? ` · ${f.hint}` : ""}${chord ? `  ${chord}` : ""}`}
                onClick={() => {
                  s.setActiveFace(f.id);
                  holdOverflowForLeave(f.id);
                }}
              >
                <span className="face-overflow-who">
                  <i className="face-dot" />
                  <span className="face-name">{f.name}</span>
                  {f.kind.startsWith("outlook") && <span className="face-mail">@</span>}
                </span>
                {s.faces.length > 1 && chord && compact ? (
                  <kbd className="face-chord compact hide-narrow">{compact}</kbd>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {menu && menu !== "outlook" && menu !== "add" && menu !== "overflow" && !s.faceNamerOpen && !s.outlookPickerOpen && (
        <FaceEditor
          faceId={menu}
          name={rename}
          setName={setRename}
          onClose={() => setMenu(null)}
        />
      )}

      <span
        key={staying ? `now-${stayTick}` : "now"}
        className={`face-now hide-narrow${staying ? " stay" : ""}`}
        style={{ ["--face" as string]: current?.color }}
      >
        Browsing as <b>{current?.name}</b>
        {currentChord ? <kbd className="hide-narrow">{currentChord}</kbd> : null}
      </span>
    </div>
  );
}

function FaceNamer({ onClose }: { onClose: () => void }) {
  const s = useHelix();
  const [name, setName] = useState("");
  const ready = normalizeFaceName(name);

  const commit = (raw?: string) => {
    const named = normalizeFaceName(raw ?? name);
    if (!named) return;
    s.addFace(named);
    onClose();
  };

  return (
    <div className="face-menu">
      <div className="pane-kicker">Name this person</div>
      <p>Who you browse as in this window. They don't exist until you name them.</p>
      <div className="face-roles">
        {FACE_ROLES.map((role) => (
          <button
            key={role}
            type="button"
            className={`face-role${ready === role ? " on" : ""}`}
            onClick={() => commit(role)}
          >
            {role}
          </button>
        ))}
      </div>
      <input
        autoFocus
        autoComplete="off"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        placeholder="Or type a name"
      />
      <button
        type="button"
        className="pal-item"
        disabled={!ready}
        onClick={() => commit()}
      >
        {ready ? `Browse as ${ready}` : "Browse as…"}
      </button>
    </div>
  );
}

function FaceEditor({
  faceId,
  name,
  setName,
  onClose,
}: {
  faceId: string;
  name: string;
  setName: (v: string) => void;
  onClose: () => void;
}) {
  const s = useHelix();
  const face = faceOf(s, faceId);
  if (!face) return null;
  return (
    <div className="face-menu">
      <div className="pane-kicker">Face</div>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            s.renameFace(faceId, name);
            onClose();
          }
        }}
        placeholder="Name this person"
      />
      <button
        className="pal-item"
        onClick={() => {
          s.renameFace(faceId, name);
          onClose();
        }}
      >
        Save name
      </button>
      {face.homeUrl && (
        <button
          className="pal-item"
          onClick={() => {
            s.openFaceHome(faceId);
            onClose();
          }}
        >
          Open inbox
        </button>
      )}
      {s.faces.length > 1 && (
        <button
          className="pal-item"
          onClick={() => {
            s.removeFace(faceId);
            onClose();
          }}
        >
          Remove face
        </button>
      )}
    </div>
  );
}
