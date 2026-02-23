import { useEffect, useState } from 'react'
import MobileLayout from './MobileLayout'
import DesktopLayout from './DesktopLayout'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}

export default function AppLayout({ children }) {
  const isMobile = useIsMobile()
  return isMobile
    ? <MobileLayout>{children}</MobileLayout>
    : <DesktopLayout>{children}</DesktopLayout>
}