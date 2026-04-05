interface HowToSchemaProps {
  name: string
  description: string
  url: string
  steps: Array<{ name: string; text: string }>
  totalTime?: string  // ISO 8601 duration, e.g. "PT15M"
}

export function HowToSchema({ name, description, url, steps, totalTime }: HowToSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    url,
    ...(totalTime ? { totalTime } : {}),
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
