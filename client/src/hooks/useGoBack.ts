import { useNavigate, useLocation } from 'react-router-dom'
import { useCallback } from 'react'

/**
 * Xavfsiz "orqaga" navigatsiya hook.
 *
 * Agar history bo'sh bo'lsa (direct link orqali kelgan), foydalanuvchi bo'sh
 * sahifaga emas, balki aniq fallback marshrutga yo'naltiriladi.
 *
 * Foydalanish:
 *   const goBack = useGoBack('/testlar')
 *   <button onClick={goBack}>←</button>
 */
export function useGoBack(fallback: string = '/') {
  const navigate = useNavigate()
  const location = useLocation()

  return useCallback(() => {
    // history.state — agar avval boshqa sahifadan kelgan bo'lsa, mavjud
    // window.history.length — brauzer history uzunligi
    // Agar history kichik (1-2) bo'lsa, foydalanuvchi to'g'ridan-to'g'ri kelgan
    const hasHistory = window.history.length > 2
    const isExternalEntry =
      !location.state &&
      (document.referrer === '' || !document.referrer.includes(window.location.host))

    if (!hasHistory || isExternalEntry) {
      navigate(fallback, { replace: true })
    } else {
      navigate(-1)
    }
  }, [navigate, location, fallback])
}
