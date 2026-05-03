import React, { type ReactNode, useEffect, useState } from 'react'
/* eslint-disable import/extensions */
import MultiColumn from '@theme-original/Footer/Links/MultiColumn'
import type MultiColumnType from '@theme/Footer/Links/MultiColumn'
import type { WrapperProps } from '@docusaurus/types'
import useBaseUrl from '@docusaurus/useBaseUrl'

type Props = WrapperProps<typeof MultiColumnType>

interface PrivacyInfo {
  dataProcessingAgreementURL: string
  dataProcessingAgreementLabel: string
  imprintURL: string
  imprintLabel: string
}

export default function MultiColumnWrapper(props: Props): ReactNode {
  console.log('MultiColumnWrapper peak', props)
  const columns = [...(props?.columns || [])]

  const [privacyInfo, setPrivacyInfo] = useState<PrivacyInfo | null>(null)
  const paths = [useBaseUrl('/privacy.json'), '/config/privacy.json']

  useEffect(() => {
    const fetchPrivacyInfo = async () => {
      for (const path of paths) {
        try {
          const response = await fetch(path)
          if (response.ok) {
            const data = await response.json()
            setPrivacyInfo(data)
            return
          }
        } catch {
          // we are not complaining, we fail silently, as this is desired behaviour
        }
      }
    }

    fetchPrivacyInfo()
  }, [])

  const newprops = { ...props, columns }
  if (privacyInfo?.dataProcessingAgreementURL || privacyInfo?.imprintURL) {
    const newLink: { title: string; items: { label: string; to: string }[] } = {
      title: 'Legal',
      items: []
    }
    if (privacyInfo.dataProcessingAgreementURL) {
      newLink.items.push({
        label:
          privacyInfo.dataProcessingAgreementLabel ||
          'Data Processing Agreement',
        to: privacyInfo.dataProcessingAgreementURL
      })
    }
    if (privacyInfo.imprintURL) {
      newLink.items.push({
        label: privacyInfo.imprintLabel || 'Imprint',
        to: privacyInfo.imprintURL
      })
    }
    columns.push(newLink)
  }
  console.log('newprops', newprops)
  return (
    <>
      <MultiColumn {...newprops} />
    </>
  )
}
