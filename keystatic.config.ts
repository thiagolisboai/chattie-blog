import { config, collection, fields } from '@keystatic/core'

const hasGitHubCreds = !!(
  process.env.KEYSTATIC_GITHUB_CLIENT_ID &&
  process.env.KEYSTATIC_GITHUB_CLIENT_SECRET &&
  process.env.KEYSTATIC_SECRET
)

export default config({
  storage: hasGitHubCreds
    ? {
        kind: 'github',
        repo: {
          owner: 'thiagolisboai',
          name: 'chattie-blog',
        },
      }
    : { kind: 'local' },

  ui: {
    brand: {
      name: 'Chattie Blog — Admin',
    },
    navigation: {
      'Blog PT-BR (Agentic)': ['blogPtBr'],
      'Blog EN (Agentic)': ['blogEn'],
    },
  },

  collections: {
    blogPtBr: collection({
      label: 'Blog PT-BR (Agentic)',
      slugField: 'slug',
      path: 'content/blog/*',
      format: { contentField: 'content' },
      entryLayout: 'content',
      schema: {
        title: fields.text({
          label: 'Título',
          validation: { isRequired: true },
        }),
        slug: fields.text({
          label: 'Slug',
          description: 'URL do post — lowercase, hifens, sem acentos',
          validation: { isRequired: true },
        }),
        lang: fields.select({
          label: 'Idioma',
          options: [{ label: 'PT-BR', value: 'pt-BR' }],
          defaultValue: 'pt-BR',
        }),
        date: fields.date({
          label: 'Data de publicação',
          validation: { isRequired: true },
        }),
        publishedAt: fields.text({
          label: 'publishedAt (ISO)',
          description: 'Ex: 2025-11-14T09:00:00-03:00',
        }),
        description: fields.text({
          label: 'Description (SEO)',
          description: '140–160 caracteres com keyword principal',
          multiline: false,
        }),
        excerpt: fields.text({
          label: 'Excerpt (card de listagem)',
          description: 'Máx 100 chars — aparece nos cards do blog',
          multiline: false,
        }),
        category: fields.select({
          label: 'Categoria',
          options: [
            { label: 'Social Selling', value: 'social-selling' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'B2B', value: 'b2b' },
            { label: 'IA para Vendas', value: 'ia-para-vendas' },
            { label: 'Chattie', value: 'chattie' },
          ],
          defaultValue: 'social-selling',
        }),
        tags: fields.array(
          fields.text({ label: 'Tag' }),
          {
            label: 'Tags',
            itemLabel: props => props.value,
          }
        ),
        image: fields.text({
          label: 'Imagem (URL)',
          description: 'URL da imagem de capa (OG image)',
        }),
        author: fields.text({
          label: 'Autor',
          defaultValue: 'Thiago Lisboa',
        }),
        readTime: fields.text({
          label: 'Tempo de leitura',
          defaultValue: '7 min',
        }),
        canonicalUrl: fields.url({
          label: 'Canonical URL',
          description: 'https://trychattie.com/pt-br/blog/[slug]',
        }),
        structuredData: fields.select({
          label: 'Structured Data',
          options: [
            { label: 'Article', value: 'article' },
            { label: 'FAQ', value: 'faq' },
            { label: 'HowTo', value: 'howto' },
          ],
          defaultValue: 'article',
        }),
        geoOptimized: fields.checkbox({
          label: 'GEO Otimizado',
          description: 'Marcar quando o post define conceitos, cita dados e tem listas estruturadas',
          defaultValue: false,
        }),
        enSlug: fields.text({
          label: 'Slug EN equivalente',
          description: 'Preencher se existir versão em inglês (para hreflang)',
        }),
        content: fields.mdx({
          label: 'Conteúdo',
          options: {
            heading: [2, 3, 4],
            bold: true,
            italic: true,
            strikethrough: false,
            code: true,
            link: true,
            image: false,
            table: true,
            divider: true,
          },
        }),
      },
    }),

    blogEn: collection({
      label: 'Blog EN (Agentic)',
      slugField: 'slug',
      path: 'content/blog-en/*',
      format: { contentField: 'content' },
      entryLayout: 'content',
      schema: {
        title: fields.text({
          label: 'Title',
          validation: { isRequired: true },
        }),
        slug: fields.text({
          label: 'Slug',
          validation: { isRequired: true },
        }),
        lang: fields.select({
          label: 'Language',
          options: [{ label: 'English', value: 'en' }],
          defaultValue: 'en',
        }),
        date: fields.date({
          label: 'Publication date',
          validation: { isRequired: true },
        }),
        publishedAt: fields.text({
          label: 'publishedAt (ISO)',
        }),
        description: fields.text({
          label: 'Description (SEO)',
          description: '140–160 chars with primary keyword',
        }),
        excerpt: fields.text({
          label: 'Excerpt',
          description: 'Short summary for listing cards',
        }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Social Selling', value: 'social-selling' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'B2B', value: 'b2b' },
            { label: 'AI for Sales', value: 'ia-para-vendas' },
            { label: 'Chattie', value: 'chattie' },
          ],
          defaultValue: 'social-selling',
        }),
        tags: fields.array(
          fields.text({ label: 'Tag' }),
          {
            label: 'Tags',
            itemLabel: props => props.value,
          }
        ),
        image: fields.text({ label: 'Cover image URL' }),
        author: fields.text({
          label: 'Author',
          defaultValue: 'Thiago Lisboa',
        }),
        readTime: fields.text({
          label: 'Read time',
          defaultValue: '7 min',
        }),
        canonicalUrl: fields.url({
          label: 'Canonical URL',
        }),
        structuredData: fields.select({
          label: 'Structured Data',
          options: [
            { label: 'Article', value: 'article' },
            { label: 'FAQ', value: 'faq' },
            { label: 'HowTo', value: 'howto' },
          ],
          defaultValue: 'article',
        }),
        geoOptimized: fields.checkbox({
          label: 'GEO Optimized',
          defaultValue: false,
        }),
        ptSlug: fields.text({
          label: 'PT-BR slug equivalent',
          description: 'Fill if there is a PT-BR version (for hreflang)',
        }),
        content: fields.mdx({
          label: 'Content',
          options: {
            heading: [2, 3, 4],
            bold: true,
            italic: true,
            strikethrough: false,
            code: true,
            link: true,
            image: false,
            table: true,
            divider: true,
          },
        }),
      },
    }),
  },
})
