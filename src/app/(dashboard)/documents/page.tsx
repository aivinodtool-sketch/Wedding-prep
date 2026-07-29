'use client'

import { Upload, FileText, Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const mockDocuments = [
  { id: '1', name: 'Venue_Contract.pdf', size: '2.4 MB', date: 'Oct 24, 2023', type: 'PDF' },
  { id: '2', name: 'Catering_Menu_Options.pdf', size: '1.1 MB', date: 'Oct 28, 2023', type: 'PDF' },
  { id: '3', name: 'Decoration_Inspiration.jpg', size: '4.5 MB', date: 'Nov 02, 2023', type: 'Image' },
]

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockDocuments.map((doc) => (
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
              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
