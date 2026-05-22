import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
/**
 * Xavfsiz va aniq "orqaga" navigatsiya hook.
 *
 * BEST PRACTICE: har doim aniq fallback URL'ga yo'naltiramiz.
 * `navigate(-1)` ishlatmaymiz — chunki SPA navigatsiyasida history
 * mantig'i chalkash bo'ladi (replace, redirect, va h.k.).
 *
 * Foydalanish:
 *   const goBack = useGoBack('/testlar')
 *   <button onClick={goBack}>←</button>
 */
export function useGoBack(fallback = '/') {
    const navigate = useNavigate();
    return useCallback(() => {
        navigate(fallback);
    }, [navigate, fallback]);
}
