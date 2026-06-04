'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/ui/Topbar'
import { BottomNav } from '@/components/ui/BottomNav'
import { formatarDataCurta, cn } from '@/lib/utils'

const miniStyle: Record<string, string> = {
  D1: 'bg-d1-bg text-d1',
  D7: 'bg-d7-bg text-d7',
  D30: 'bg-d30-bg text-d30',
  done: 'bg-done-bg text-done',
}
