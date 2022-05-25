import { useRouter } from 'next/router'
import {useEffect, useState} from "react";
export default function Home() {
  const router = useRouter()
  const [hasReplace, setHasReplace] = useState(false)

  useEffect(() => {
    router.replace('/resource')
  }, [])

  return null
}
