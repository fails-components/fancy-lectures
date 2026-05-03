import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

let prefixCounter = 1

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Fancy lectures with FAILS components',
  tagline: 'Making Hybrid Lectures Exciting and Effortless.',
  favicon: 'img/brand/favicon.ico',
  markdown: {
    mermaid: true
  },
  themes: ['@docusaurus/theme-mermaid'],

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://your-docusaurus-site.example.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'fails-components', // Usually your GitHub org/user name.
  projectName: 'fancy-lectures', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en']
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/fails-components/fancy-lectures/tree/master/docs/'
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/fails-components/fancy-lectures/tree/master/docs/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn'
        },
        theme: {
          customCss: './src/css/custom.css'
        },

        svgr: {
          svgrConfig: {
            svgoConfig: {
              plugins: [
                {
                  name: 'prefixIds',
                  params: {
                    delim: '',
                    prefix: () => 'p' + prefixCounter++
                  }
                },
                {
                  name: 'removeXlink',
                  params: {
                    includeLegacy: true
                  }
                }
              ]
            }
          }
        }
      } satisfies Preset.Options
    ]
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true
    },
    navbar: {
      title: 'Fancy lectures',
      logo: {
        alt: 'FAILS components',
        src: 'img/brand/logo.svg'
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation'
        },
        { to: '/blog', label: 'Blog', position: 'left' },
        {
          href: 'https://github.com/fails-components/fancy-lectures',
          label: 'GitHub',
          position: 'right'
        }
      ]
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Overview',
              to: '/docs/intro'
            },
            {
              label: 'Lecturer Guide',
              to: '/docs/docents/intro'
            },
            {
              label: 'Student Guide',
              to: '/docs/students/intro'
            },
            {
              label: 'Administrator infos',
              to: '/docs/admins/intro'
            },
            {
              label: 'Developer Guide',
              to: '/docs/developer/intro'
            }
          ]
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog'
            },
            {
              label: 'GitHub',
              href: 'https://github.com/fails-components/fancy-lectures'
            }
          ]
        }
      ],
      copyright: `Copyright © ${new Date().getFullYear()} FAILS components' contributors. Built with Docusaurus.`
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula
    }
  } satisfies Preset.ThemeConfig
}

export default config
