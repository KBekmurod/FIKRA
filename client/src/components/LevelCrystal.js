import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './LevelCrystal.css';
export default function LevelCrystal({ level, streak }) {
    // Level qanchalik baland bo'lsa, kristall shunchalik "premium" ranglarga kiradi
    let color1 = '#7b68ee'; // asosiy
    let color2 = '#00d4aa'; // yorqin
    if (level >= 10) {
        color1 = '#ff5f7e';
        color2 = '#ffcc44';
    }
    if (level >= 20) {
        color1 = '#9d8fff';
        color2 = '#ff5f7e';
    }
    // Agar streak yo'qolgan bo'lsa, xiralashadi
    const opacity = streak > 0 ? 1 : 0.4;
    const animationSpeed = streak > 0 ? (Math.max(2, 8 - level * 0.1)) + 's' : '15s';
    return (_jsxs("div", { className: "crystal-container", style: { opacity }, children: [_jsxs("div", { className: "crystal", style: { animationDuration: animationSpeed }, children: [_jsx("div", { className: "face front", style: { background: `linear-gradient(135deg, ${color1}88, ${color2}88)` } }), _jsx("div", { className: "face back", style: { background: `linear-gradient(135deg, ${color1}88, ${color2}88)` } }), _jsx("div", { className: "face left", style: { background: `linear-gradient(135deg, ${color1}AA, ${color2}AA)` } }), _jsx("div", { className: "face right", style: { background: `linear-gradient(135deg, ${color1}AA, ${color2}AA)` } }), _jsx("div", { className: "face top", style: { background: `linear-gradient(135deg, ${color1}DD, ${color2}DD)` } }), _jsx("div", { className: "face bottom", style: { background: `linear-gradient(135deg, ${color1}55, ${color2}55)` } })] }), _jsx("div", { className: "crystal-glow", style: {
                    background: `radial-gradient(circle, ${color1}44 0%, transparent 70%)`,
                    opacity: streak > 0 ? 1 : 0.2
                } })] }));
}
