import type { ReactNode, ComponentType, ComponentProps } from 'react'
import React from 'react'
import clsx from 'clsx'
import Heading from '@theme/Heading'
import styles from './styles.module.css'

type FeatureItem = {
  title: string
  Svg: ComponentType<ComponentProps<'svg'>>
  description: ReactNode
}
/* Text iterated with Gemini, rewritten and generated */
const FeatureList: FeatureItem[] = [
  {
    title: 'FAILS - components',
    Svg: require('@site/static/img/brand/undraw_fails_intro.svg').default,
    description: (
      <>
        FAILS is the <i> Fancy automated internet lecture system</i>. A
        non-profit project, developed and designed by a university docent in his
        spare time.
      </>
    )
  },
  {
    title: 'Electronic chalk',
    Svg: require('@site/static/img/brand/undraw_fails_echalk.svg').default,
    description: (
      <>
        Handwritten lectures remain the gold standard for mathematics and
        theoretical physics. FAILS adapts this tradition for digital ink,
        supporting smart boards, pen-enabled tablets, and notepads.
      </>
    )
  },
  {
    title: 'Interactive hybrid lectures',
    Svg: require('@site/static/img/brand/undraw_fails_hybrid_lecture.svg')
      .default,
    description: (
      <>
        Students follow the lecture on their devices with independent scrolling,
        notes, chat questions, Jupyter applets, and polls. A PDF of the
        blackboard is generated for download.
      </>
    )
  },
  {
    title: 'Audio and video transmission',
    Svg: require('@site/static/img/brand/undraw_fails_av.svg').default,
    description: (
      <>
        Optional audio and video transmission for joining lectures from home.
        Privacy-first design using modern WebCodecs, WebTransport, pseudonymized
        routing, and end-to-end encryption.
      </>
    )
  },
  {
    title: 'Modern architecture',
    Svg: require('@site/static/img/brand/undraw_fails_archi.svg').default,
    description: (
      <>
        Reliable with a modern, containerized architecture. Powered by React,
        Node.js, MongoDB, and Redis—deployable via Docker compose or Kubernetes
        and seamlessly integrated via LTI into LMS.
      </>
    )
  },
  {
    title: 'Reusable open source components',
    Svg: require('@site/static/img/brand/undraw_fails_components.svg').default,
    description: (
      <>
        FAILS provides reusable OS components, including a Node.js package for
        WebTransport, an audio/video router, and client-side packages for video
        conferencing, Jupyter applets, and pen notebooks.
      </>
    )
  }
]

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className='text--center'>
        <Svg className={styles.featureSvg} role='img' />
      </div>
      <div className='text--center padding-horiz--md'>
        <Heading as='h3'>{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  )
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className='container'>
        <div className='row'>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  )
}
