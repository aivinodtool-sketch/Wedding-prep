'use server'

import { revalidatePath } from 'next/cache'

export type DocumentItem = {
  id: string
  name: string
  size: string
  date: string
  type: string
}

// In-memory / initial document registry fallback if storage bucket is not configured
const mockDocsStore: DocumentItem[] = [
  { id: '1', name: 'Venue_Contract.pdf', size: '2.4 MB', date: 'Oct 24, 2024', type: 'PDF' },
  { id: '2', name: 'Catering_Menu_Options.pdf', size: '1.1 MB', date: 'Oct 28, 2024', type: 'PDF' },
]

export async function getDocuments(): Promise<DocumentItem[]> {
  return mockDocsStore
}

export async function addDocument(formData: FormData): Promise<DocumentItem> {
  const name = formData.get('name') as string || 'Document.pdf'
  const newDoc: DocumentItem = {
    id: Date.now().toString(),
    name,
    size: '1.5 MB',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    type: name.endsWith('.jpg') || name.endsWith('.png') ? 'Image' : 'PDF',
  }

  mockDocsStore.unshift(newDoc)
  revalidatePath('/documents')
  return newDoc
}

export async function deleteDocument(docId: string) {
  const idx = mockDocsStore.findIndex((d) => d.id === docId)
  if (idx !== -1) {
    mockDocsStore.splice(idx, 1)
  }
  revalidatePath('/documents')
}
