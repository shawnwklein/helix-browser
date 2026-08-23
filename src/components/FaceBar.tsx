import { useEffect, useRef, useState } from "react";
import { activeFace, faceOf, useHelix } from "../store";

export function FaceBar() {
  const s = useHelix();
  const current = activeFace(s);
  const [menu, setMenu] = useState<"outlook" | "add" | string | null>(null);
  const [rename, setRename] = useState("");
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="faces" ref={wrap}>
      {s.faces.map((f, i) => (
        <button
          key={f.id}
          className={`face-pill${f.id === s.activeFaceId ? " on" : ""}`}
          style={{ ["--face" as string]: f.color }}
          title={`${f.name}${f.hint ? ` · ${f.hint}` : ""}  Ctrl+${i + 1}`}
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
          {f.kind.startsWith("outlook") && <span className="face-mail">@</span>}
        </button>
      ))}

      <div className="face-actions">
        <button
          className="outlook-add"
          title="Add another Outlook account — isolated cookies, same window"
          onClick={() => setMenu(menu === "outlook" ? null : "outlook")}
        >
          + Outlook
        </button>
        <button
          className="ico"
          title="New face"
          onClick={() => s.addFace()}
        >
          +
        </button>
      </div>

      {menu === "outlook" && (
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

      {menu && menu !== "outlook" && menu !== "add" && (
        <FaceEditor
          faceId={menu}
          name={rename}
          setName={setRename}
          onClose={() => setMenu(null)}
        />
      )}

      <span className="face-now hide-narrow" style={{ ["--face" as string]: current?.color }}>
        Browsing as <b>{current?.name}</b>
      </span>
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
