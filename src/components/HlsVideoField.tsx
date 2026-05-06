'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useFormFields } from '@payloadcms/ui'
import ReactHlsPlayer from 'react-hls-video-player'

type Props = {
  keepOriginal?: boolean
  collectionSlug: string
}

type SiblingStatus =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'found'; id: string | number; filename: string }
  | { state: 'missing' }
  | { state: 'error' }

const isM3u8 = (url?: string | null, mimeType?: string | null) => {
  if (mimeType === 'application/x-mpegURL') return true
  if (typeof url === 'string' && url.toLowerCase().split('?')[0].endsWith('.m3u8')) return true
  return false
}

const getBasename = (filename?: string | null) => {
  if (!filename) return null
  const dot = filename.lastIndexOf('.')
  return dot > 0 ? filename.slice(0, dot) : filename
}

export const HlsVideoField: React.FC<Props> = ({ keepOriginal, collectionSlug }) => {
  const url = useFormFields(
    ([fields]: [Record<string, any>, unknown]) => fields?.['url']?.value as string | undefined,
  )
  const mimeType = useFormFields(
    ([fields]: [Record<string, any>, unknown]) =>
      fields?.['mimeType']?.value as string | undefined,
  )
  const filename = useFormFields(
    ([fields]: [Record<string, any>, unknown]) =>
      fields?.['filename']?.value as string | undefined,
  )

  const playerRef = useRef<HTMLVideoElement>(null)
  const [sibling, setSibling] = useState<SiblingStatus>({ state: 'idle' })

  const showHls = isM3u8(url, mimeType)
  const showVideo = !showHls && typeof mimeType === 'string' && mimeType.startsWith('video/')

  useEffect(() => {
    if (!showVideo) {
      setSibling({ state: 'idle' })
      return
    }
    const base = getBasename(filename)
    if (!base) return

    let cancelled = false
    setSibling({ state: 'loading' })

    const query = `where[filename][equals]=${encodeURIComponent(`${base}.m3u8`)}&limit=1&depth=0`
    fetch(`/api/${collectionSlug}?${query}`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`status ${res.status}`)
        return res.json()
      })
      .then((data: { docs?: Array<{ id: string | number; filename: string }> }) => {
        if (cancelled) return
        const doc = data?.docs?.[0]
        if (doc) {
          setSibling({ state: 'found', id: doc.id, filename: doc.filename })
        } else {
          setSibling({ state: 'missing' })
        }
      })
      .catch(() => {
        if (!cancelled) setSibling({ state: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [collectionSlug, filename, showVideo])

  if (!url) return null

  if (showHls) {
    const Player = ReactHlsPlayer as unknown as React.FC<{
      src: string
      controls?: boolean
      muted?: boolean
      playsInline?: boolean
      autoPlay?: boolean
      playerRef?: React.RefObject<HTMLVideoElement>
      style?: React.CSSProperties
    }>
    return (
      <div style={{ marginBottom: 'var(--base)' }}>
        <Player
          src={url}
          controls
          muted
          playsInline
          autoPlay={false}
          playerRef={playerRef as React.RefObject<HTMLVideoElement>}
          style={{ width: '100%', maxHeight: 480, background: '#000' }}
        />
      </div>
    )
  }

  if (showVideo) {
    return (
      <div style={{ marginBottom: 'var(--base)' }}>
        <video
          src={url}
          controls
          playsInline
          style={{ width: '100%', maxHeight: 480, background: '#000' }}
        />
        <SiblingStatusLine
          collectionSlug={collectionSlug}
          keepOriginal={keepOriginal}
          status={sibling}
        />
      </div>
    )
  }

  return null
}

const SiblingStatusLine: React.FC<{
  collectionSlug: string
  keepOriginal?: boolean
  status: SiblingStatus
}> = ({ collectionSlug, keepOriginal, status }) => {
  const style: React.CSSProperties = {
    fontSize: 12,
    marginTop: 8,
    opacity: 0.8,
  }

  if (status.state === 'idle' || status.state === 'loading') {
    return <p style={style}>Checking ABR manifest…</p>
  }

  if (status.state === 'found') {
    return (
      <p style={style}>
        ✅ ABR manifest ready:{' '}
        <a href={`/admin/collections/${collectionSlug}/${status.id}`}>{status.filename}</a>
      </p>
    )
  }

  if (status.state === 'error') {
    return <p style={style}>⚠️ Could not check ABR manifest status.</p>
  }

  // missing
  if (keepOriginal) {
    return (
      <p style={style}>
        ⏳ ABR manifest not found yet — processing may still be running or may have failed.
      </p>
    )
  }

  return (
    <p style={style}>
      ⏳ Processing — this document will be deleted when the .m3u8 manifest is created.
    </p>
  )
}

export default HlsVideoField
