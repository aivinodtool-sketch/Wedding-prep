'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, FolderPlus, Check, X, FolderTree, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  Category,
} from '@/actions/categories'

interface CategoryManagerProps {
  weddingId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactElement
  onCategoriesUpdated?: () => void
}

export function CategoryManager({
  weddingId,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  trigger,
  onCategoriesUpdated,
}: CategoryManagerProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const isOpen = isControlled ? externalOpen : internalOpen

  const handleOpenChange = (newOpen: boolean) => {
    if (externalOnOpenChange) {
      externalOnOpenChange(newOpen)
    } else {
      setInternalOpen(newOpen)
    }
  }

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newMainCategoryName, setNewMainCategoryName] = useState('')
  const [addingSubParentId, setAddingSubParentId] = useState<string | null>(null)
  const [newSubCategoryName, setNewSubCategoryName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function loadData() {
    if (!weddingId) return
    setLoading(true)
    const data = await getCategories(weddingId)
    setCategories(data)
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, weddingId])

  async function handleAddMainCategory() {
    if (!newMainCategoryName.trim()) return
    setErrorMsg(null)
    try {
      await createCategory(weddingId, newMainCategoryName.trim(), null)
      setNewMainCategoryName('')
      await loadData()
      if (onCategoriesUpdated) onCategoriesUpdated()
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating category')
    }
  }

  async function handleAddSubCategory(parentId: string) {
    if (!newSubCategoryName.trim()) return
    setErrorMsg(null)
    try {
      await createCategory(weddingId, newSubCategoryName.trim(), parentId)
      setNewSubCategoryName('')
      setAddingSubParentId(null)
      await loadData()
      if (onCategoriesUpdated) onCategoriesUpdated()
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating subcategory')
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editName.trim()) return
    setErrorMsg(null)
    try {
      await updateCategory(id, editName.trim())
      setEditingId(null)
      setEditName('')
      await loadData()
      if (onCategoriesUpdated) onCategoriesUpdated()
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating category')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this category/subcategory?')) return
    setErrorMsg(null)
    try {
      await deleteCategory(id)
      await loadData()
      if (onCategoriesUpdated) onCategoriesUpdated()
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting category')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FolderTree className="h-5 w-5 text-primary" />
            Manage Categories & Subcategories
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <div className="p-2.5 my-2 text-xs font-medium bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 rounded-md">
            {errorMsg}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
          {/* Add New Main Category Form */}
          <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border">
            <Input
              placeholder="Add new main category..."
              value={newMainCategoryName}
              onChange={(e) => setNewMainCategoryName(e.target.value)}
              className="h-9 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddMainCategory()
                }
              }}
            />
            <Button size="sm" className="h-9 shrink-0" onClick={handleAddMainCategory}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Category
            </Button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading categories...</div>
          ) : (
            <div className="space-y-3">
              {categories.map((cat) => {
                const isEditingMain = editingId === cat.id
                const isAddingSub = addingSubParentId === cat.id

                return (
                  <div
                    key={cat.id}
                    className="rounded-xl border bg-card p-3.5 shadow-2xs space-y-2 transition-all hover:border-primary/30"
                  >
                    {/* Parent Category Header */}
                    <div className="flex items-center justify-between gap-2">
                      {isEditingMain ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-emerald-600"
                            onClick={() => handleSaveEdit(cat.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
                            {cat.name}
                          </span>
                          <Badge variant="secondary" className="text-[10px] px-2 py-0">
                            {cat.children?.length || 0} subcategories
                          </Badge>
                        </div>
                      )}

                      {!isEditingMain && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => {
                              setAddingSubParentId(isAddingSub ? null : cat.id)
                              setNewSubCategoryName('')
                            }}
                          >
                            <FolderPlus className="mr-1 h-3.5 w-3.5" />
                            + Subcategory
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => {
                              setEditingId(cat.id)
                              setEditName(cat.name)
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(cat.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Inline Add Subcategory Form */}
                    {isAddingSub && (
                      <div className="flex items-center gap-2 pl-4 py-2 border-l-2 border-primary/40 bg-primary/5 rounded-r-md">
                        <Input
                          placeholder={`New subcategory under ${cat.name}...`}
                          value={newSubCategoryName}
                          onChange={(e) => setNewSubCategoryName(e.target.value)}
                          className="h-8 text-xs bg-background"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddSubCategory(cat.id)
                            }
                          }}
                        />
                        <Button size="sm" className="h-8 text-xs shrink-0" onClick={() => handleAddSubCategory(cat.id)}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-muted-foreground shrink-0"
                          onClick={() => setAddingSubParentId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}

                    {/* Nested Subcategories List */}
                    {cat.children && cat.children.length > 0 && (
                      <div className="pl-3 space-y-1.5 border-l-2 border-zinc-200 dark:border-zinc-800 ml-1 pt-1">
                        {cat.children.map((sub) => {
                          const isEditingSub = editingId === sub.id
                          return (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between gap-2 py-1 px-2.5 rounded-md hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors text-xs"
                            >
                              {isEditingSub ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="h-7 text-xs"
                                    autoFocus
                                  />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-emerald-600"
                                    onClick={() => handleSaveEdit(sub.id)}
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-muted-foreground"
                                    onClick={() => setEditingId(null)}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    <span className="font-medium">{sub.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-muted-foreground hover:text-primary"
                                      onClick={() => {
                                        setEditingId(sub.id)
                                        setEditName(sub.name)
                                      }}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                      onClick={() => handleDelete(sub.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}

              {categories.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-xs border border-dashed rounded-lg">
                  No categories found. Create a main category above to get started.
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
