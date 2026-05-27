import React from 'react';
import './LevelCrystal.css';
export default function LevelCrystal(_a) {
    var level = _a.level, streak = _a.streak;
    // Level qanchalik baland bo'lsa, kristall shunchalik "premium" ranglarga kiradi
    var color1 = '#7b68ee'; // asosiy
    var color2 = '#00d4aa'; // yorqin
    if (level >= 10) {
        color1 = '#ff5f7e';
        color2 = '#ffcc44';
    }
    if (level >= 20) {
        color1 = '#9d8fff';
        color2 = '#ff5f7e';
    }
    // Agar streak yo'qolgan bo'lsa, xiralashadi
    var opacity = streak > 0 ? 1 : 0.4;
    var animationSpeed = streak > 0 ? (Math.max(2, 8 - level * 0.1)) + 's' : '15s';
    return (<div className="crystal-container" style={{ opacity: opacity }}>
      <div className="crystal" style={{ animationDuration: animationSpeed }}>
        <div className="face front" style={{ background: "linear-gradient(135deg, " + color1 + "88, " + color2 + "88)" }}/>
        <div className="face back" style={{ background: "linear-gradient(135deg, " + color1 + "88, " + color2 + "88)" }}/>
        <div className="face left" style={{ background: "linear-gradient(135deg, " + color1 + "AA, " + color2 + "AA)" }}/>
        <div className="face right" style={{ background: "linear-gradient(135deg, " + color1 + "AA, " + color2 + "AA)" }}/>
        <div className="face top" style={{ background: "linear-gradient(135deg, " + color1 + "DD, " + color2 + "DD)" }}/>
        <div className="face bottom" style={{ background: "linear-gradient(135deg, " + color1 + "55, " + color2 + "55)" }}/>
      </div>
      
      
      <div className="crystal-glow" style={{
        background: "radial-gradient(circle, " + color1 + "44 0%, transparent 70%)",
        opacity: streak > 0 ? 1 : 0.2
    }}/>
    </div>);
}
