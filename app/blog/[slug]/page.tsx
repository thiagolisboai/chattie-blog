import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function BlogPostEnPlaceholder({ params }: Props) {
  const { slug } = await params
  redirect(`/pt-br/blog/${slug}`)
}
