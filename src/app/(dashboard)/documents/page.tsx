'use client'

import { useState, useEffect } from 'react'
import { Upload, FileText, Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getDocuments, addDocument, deleteDocument, DocumentItem } from '@/actions/documents'

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentItem[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDocs() {
      setLoading(true)
      const data = await getDocuments()
      setDocs([...data])
      setLoading(false)
    }
    loadDocs()
  }, [])

  async function handleAddDoc(formData: FormData) {
    await addDocument(formData)
    setIsDialogOpen(false)
    const updated = await getDocuments()
    setDocs([...updated])
  }

  async function handleDeleteDoc(id: string) {
    await deleteDocument(id)
    setDocs((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Documents</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <form action={handleAddDoc} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Document Name / Title</Label>
                <Input id="name" name="name" placeholder="Venue_Contract.pdf" required />
              </div>
              <Button type="submit" className="w-full">Upload</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Loading documents...</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <Card key={doc.id} className="group">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 rounded bg-primary/10 flex items-center justify-center text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-medium truncate" title={doc.name}>
                    {doc.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {doc.size} • {doc.date}
                  </p>
                </div>
                <div className="flex flex-col gap-2 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => alert(`Downloading ${doc.name}`)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteDoc(doc.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {docs.length === 0 && (
            <div className="col-span-full text-center py-12 border rounded-lg bg-card text-muted-foreground">
              No documents uploaded yet. Click &quot;Upload Document&quot; above.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
