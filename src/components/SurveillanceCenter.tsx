import React, { useState, useRef } from "react";
import "./SurveillanceCenter.css";

// --- KAMERALISTE ---
const CAMS = [
  { name: "Treppenhaus", src: null, type: "gif", status: "online" },
  { name: "Fahrstuhl", src: null, type: "gif", status: "online" },
  { name: "Parkplatz", src: null, type: "gif", status: "online" },
  { name: "Hausflur", src: null, type: "gif", status: "online" },
  { name: "Garten", src: null, type: "gif", status: "online" },
  { name: "Lobby", src: null, type: "gif", status: "online" },

  { name: "Kantine", src: null, type: "gif", status: "online" },
  { name: "Serverraum", src: null, type: "gif", status: "online" },
  { name: "Empfang", src: null, type: "gif", status: "online" },
  { name: "Archiv", src: null, type: "gif", status: "online" },
  { name: "Straßenkreuzung", src: null, type: "gif", status: "online" },
  { name: "Bushaltestelle", src: null, type: "gif", status: "online" },

  { name: "U-Bahn", src: null, type: "gif", status: "online" },
  { name: "Büro", src: null, type: "gif", status: "online" },
  { name: "Lager", src: null, type: "gif", status: "online" },
  { name: "Werkstatt", src: null, type: "gif", status: "online" },
  { name: "Keller", src: null, type: "gif", status: "online" },
  { name: "Dach", src: null, type: "gif", status: "online" },

  { name: "Innenhof", src: null, type: "gif", status: "online" },
  { name: "Garage", src: null, type: "gif", status: "online" },
  { name: "Supermarkt", src: null, type: "gif", status: "online" },
  { name: "Eingang", src: null, type: "gif", status: "online" },
  { name: "Ausgang", src: null, type: "gif", status: "online" },
  { name: "Brücke", src: null, type: "gif", status: "online" },

  { name: "Tunnel", src: null, type: "gif", status: "online" },
  { name: "Kreisel", src: null, type: "gif", status: "online" },
  { name: "Ampel", src: null, type: "gif", status: "online" },
  { name: "Schule", src: null, type: "gif", status: "online" },
  { name: "Spielplatz", src: null, type: "gif", status: "online" },
  { name: "Park", src: null, type: "gif", status: "online" },

  { name: "Tankstelle", src: null, type: "gif", status: "online" },
  { name: "Bahnhof", src: null, type: "gif", status: "online" },
  { name: "Hafen", src: null, type: "gif", status: "online" },
  { name: "Zolltor", src: null, type: "gif", status: "online" },
  { name: "Grenzposten", src: null, type: "gif", status: "online" },
  { name: "Kontrollpunkt", src: null, type: "gif", status: "online" },
];

export default function SurveillanceCenter() {
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom] = useState(false);
  const videoRef = useRef(null);

  // --- VIDEO CONTROLS ---
  const play = () => videoRef.current?.play();
  const pause = () => videoRef.current?.pause();
  const stop = () => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
  };
  const rewind = () => {
    if (videoRef.current) videoRef.current.currentTime -= 5;
  };
  const forward = () => {
    if (videoRef.current) videoRef.current.currentTime += 5;
  };
  const live = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = videoRef.current.duration || 0;
    videoRef.current.play();
  };

  // --- RASTERANSICHT ---
  if (selected === null) {
    return (
      <div className="surveillance-grid">
        {CAMS.map((cam, i) => (
          <div
            key={i}
            className="surveillance-tile"
            onClick={() => setSelected(i)}
          >
            {" "}
            {/* LED */} <div className={`surveillance-led ${cam.status}`}></div>{" "}
            {/* Feed */}{" "}
            <div className="surveillance-tile-feed">
              {" "}
            <img src={cam.src || "/images/coming-soon.png"} alt={cam.name} style={{ width: "100%", height: "100%", objectFit: "cover"
                }}
              />{" "}
            </div>{" "}
            {/* Signal Lost */}{" "}
            {cam.status === "offline" && (
              <div className="signal-lost">SIGNAL LOST</div>
            )}{" "}
            {/* Name */}{" "}
            <div className="surveillance-tile-name">{cam.name}</div>
          </div>
        ))}
      </div>
    );
  }

  // --- EINZELANSICHT ---
  const cam = CAMS[selected];

  return (
    <div className="surveillance-center">
      <div className="surveillance-header">
        <button className="surveillance-back" onClick={() => setSelected(null)}>
          ← Zurück
        </button>
        {cam.name}
      </div>

      <div
        className={`zoomable ${zoom ? "zoomed" : ""}`}
        onDoubleClick={() => setZoom((z) => !z)}
        onWheel={(e) => {
          if (e.deltaY < 0) setZoom(true);
          else setZoom(false);
        }}
      >
        {cam.type === "gif" ? (
  <img
    src={cam.src || "/images/coming-soon.png"}
    alt={cam.name}
    style={{
      width: "100%",
      maxHeight: 380,
      objectFit: "cover",
      background: "#232323"
    }}
  />
) : (
  <video
    ref={videoRef}
    src={cam.src || "/images/coming-soon.png"}
    autoPlay
    loop
    style={{
      width: "100%",
      maxHeight: 380,
      objectFit: "cover",
      background: "#232323"
    }}
  />
)}

      </div>

      <div className="surveillance-controls">
        <button onClick={play}>▶</button>
        <button onClick={pause}>⏸</button>
        <button onClick={stop}>⏹</button>
        <button onClick={rewind}>⏪</button>
        <button onClick={forward}>⏩</button>
        <button onClick={live}>LIVE</button>
      </div>
    </div>
  );
}
