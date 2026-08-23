import { useEffect, useRef, useState } from "react";
import { FACE_ROLES, faceSwitchChord, faceSwitchChordCompact, normalizeFaceName } from "../lib/faces";
import { activeFace, faceOf, useHelix } from "../store";

export function FaceBar() {
  const s = useHelix();
  const current = activeFace(s);
  const currentChord =
    s.faces.length > 1
      ? faceSwitchChord(s.faces.findIndex((f) => f.id === s.activeFaceId))
      : null;
  const [menu, setMenu] = useState<"outlook" | "add" | string | null>(null);
  const [rename, setRename] = useState("");
  const [stayTick, setStayTick] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);

  const namerOpen = menu === "add" || s.faceNamerOpen;

  const closeMenus = () => {
    setMenu(null);
    useHelix.getState().setFaceNamerOpen(false);
  };

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) {
        setMenu(null);
        useHelix.getState().setFaceNamerOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!namerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setMenu(null);
      useHelix.getState().setFaceNamerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [namerOpen]);

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

  return (
    <div className="faces" ref={wrap}>
      {s.faces.map((f, i) => {
        const chord = faceSwitchChord(i);
        const compact = faceSwitchChordCompact(i);
        const on = f.id === s.activeFaceId;
        return (
          <button
            key={on && staying ? `${f.id}-stay-${stayTick}` : f.id}
            className={`face-pill${on ? " on" : ""}${on && staying ? " stay" : ""}`}
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

      <div className="face-actions">
        <button
          className="outlook-add"
          title="Add another Outlook account — isolated cookies, same window"
          onClick={() => {
            s.setFaceNamerOpen(false);
            setMenu(menu === "outlook" ? null : "outlook");
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
              setMenu("add");
            }
          }}
        >
          +
        </button>
      </div>

      {menu === "outlook" && !s.faceNamerOpen && (
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
            }}
          >
            Personal Microsoft
            <kbd>live.com</kbd>
          </button>
        </div>
      )}

      {namerOpen && <FaceNamer onClose={closeMenus} />}

      {menu && menu !== "outlook" && menu !== "add" && !s.faceNamerOpen && (
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
