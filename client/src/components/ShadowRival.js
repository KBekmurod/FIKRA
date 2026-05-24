import React, { useEffect, useState } from 'react';
export default function ShadowRival(_a) {
    var name = _a.name, expectedScore = _a.expectedScore, accuracy = _a.accuracy, duration = _a.duration, isActive = _a.isActive;
    var _b = useState(0), progress = _b[0], setProgress = _b[1];
    useEffect(function () {
        if (!isActive || duration <= 0)
            return;
        // Calculate how much score to add per second to reach expectedScore in 'duration' seconds
        var scorePerSecond = expectedScore / duration;
        var intervalTimeMs = 1000; // update every second
        var scorePerInterval = scorePerSecond * (intervalTimeMs / 1000);
        var interval = setInterval(function () {
            setProgress(function (p) {
                var next = p + scorePerInterval;
                return next > expectedScore ? expectedScore : next;
            });
        }, intervalTimeMs);
        return function () { return clearInterval(interval); };
    }, [isActive, expectedScore, duration]);
    return (<div style={{
        background: 'rgba(20,20,42,0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,95,126,0.3)',
        borderRadius: '12px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        boxShadow: '0 4px 20px rgba(255,95,126,0.1)'
    }}>
      <div style={{ fontSize: 24 }}>🥷</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt)' }}>{name}</div>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--r)' }}>{progress.toFixed(1)}%</div>
        </div>
        <div style={{ height: 6, background: 'var(--s2)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{
        height: '100%',
        width: Math.min(progress, 100) + "%",
        background: 'linear-gradient(90deg, #ff5f7e, #ff9f43)',
        transition: 'width 0.5s ease-out'
    }}/>
        </div>
      </div>
    </div>);
}
