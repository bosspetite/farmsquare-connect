import React, { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, Trash2, UploadCloud, Search, Power, PowerOff } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { FileUploader } from '@/components/ui/FileUploader';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ProductImageLibraryItem } from '@/types';
import {
  deleteLibraryImage,
  getAllProductLibraryImages,
  updateLibraryImage,
  uploadLibraryImage,
} from '@/services/productImageLibraryService';

const categories = ['Vegetables', 'Fruits', 'Grains', 'Tubers', 'Livestock', 'Others'];

const AdminProductImageLibrary = () => {
  const { user } = useAuth();
  const [images, setImages] = useState<ProductImageLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyImageId, setBusyImageId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [fileObjects, setFileObjects] = useState<File[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const loadImages = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await getAllProductLibraryImages();
      setImages(data);
    } catch (error) {
      console.error('[AdminProductImageLibrary] Failed to load library images', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load image library.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadImages();
  }, []);

  const filteredImages = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return images.filter((image) => {
      const matchesSearch =
        !searchLower ||
        image.name.toLowerCase().includes(searchLower) ||
        image.category?.toLowerCase().includes(searchLower);
      const matchesCategory = categoryFilter === 'All' || image.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [categoryFilter, images, search]);

  const handleUpload = async () => {
    if (!user?.id) {
      toast({ title: 'Admin session required', description: 'Please sign in again.', variant: 'destructive' });
      return;
    }

    if (!name.trim()) {
      toast({ title: 'Image name required', description: 'Add a produce name before saving.', variant: 'destructive' });
      return;
    }

    if (fileObjects.length === 0) {
      toast({ title: 'Image required', description: 'Upload a produce image to add it to the library.', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      const saved = await uploadLibraryImage({
        name,
        category,
        file: fileObjects[0],
        createdBy: user.id,
      });
      setImages((current) => [saved, ...current]);
      setName('');
      setCategory('');
      setFiles([]);
      setFileObjects([]);
      toast({ title: 'Image added', description: `${saved.name} is now available in the product image library.` });
    } catch (error) {
      console.error('[AdminProductImageLibrary] Failed to upload library image', error);
      toast({
        title: 'Could not save image',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (image: ProductImageLibraryItem) => {
    try {
      setBusyImageId(image.id);
      await updateLibraryImage(image.id, { isActive: !image.isActive });
      setImages((current) =>
        current.map((item) => (item.id === image.id ? { ...item, isActive: !item.isActive } : item))
      );
      toast({
        title: image.isActive ? 'Image disabled' : 'Image enabled',
        description: image.isActive
          ? `${image.name} has been hidden from farmers.`
          : `${image.name} is available for farmer listings again.`,
      });
    } catch (error) {
      console.error('[AdminProductImageLibrary] Failed to toggle image availability', error);
      toast({
        title: 'Could not update image',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBusyImageId(null);
    }
  };

  const handleDelete = async (image: ProductImageLibraryItem) => {
    try {
      setBusyImageId(image.id);
      await deleteLibraryImage(image);
      setImages((current) => current.filter((item) => item.id !== image.id));
      toast({ title: 'Image deleted', description: `${image.name} has been removed from the library.` });
    } catch (error) {
      console.error('[AdminProductImageLibrary] Failed to delete library image', error);
      toast({
        title: 'Could not delete image',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBusyImageId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Product Image Library</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Upload produce images once so farmers can reuse them while creating listings.
          </p>
        </div>

        <div className="farm-card space-y-4">
          <div>
            <h2 className="font-semibold text-foreground">Add Library Image</h2>
            <p className="text-sm text-muted-foreground mt-1">These images appear in the farmer product listing flow.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Produce name</label>
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tomatoes, Yam, Maize..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground"
                >
                  <option value="">Select category</option>
                  {categories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <FileUploader
                files={files}
                onFilesChange={setFiles}
                fileObjects={fileObjects}
                onFileObjectsChange={setFileObjects}
                maxFiles={1}
              />
              <button
                type="button"
                onClick={handleUpload}
                disabled={saving}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <UploadCloud className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save to Library'}
              </button>
            </div>
          </div>
        </div>

        <div className="farm-card space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by produce name or category..."
                className="pl-9"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="px-4 py-2 bg-card border border-border rounded-lg text-foreground"
            >
              <option value="All">All categories</option>
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3 animate-pulse" />
              <p className="text-sm text-muted-foreground">Loading image library...</p>
            </div>
          ) : errorMessage ? (
            <div className="text-center py-12">
              <p className="font-medium text-foreground mb-2">Could not load image library</p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No produce images match your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredImages.map((image) => {
                const isBusy = busyImageId === image.id;
                return (
                  <div key={image.id} className="border border-border rounded-2xl overflow-hidden bg-card">
                    <div className="aspect-[4/3] bg-muted">
                      <img src={image.imageUrl} alt={image.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{image.name}</p>
                          <p className="text-sm text-muted-foreground">{image.category || 'Uncategorized'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${image.isActive ? 'bg-farm-success/10 text-farm-success' : 'bg-muted text-muted-foreground'}`}>
                          {image.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(image)}
                          disabled={isBusy}
                          className="flex-1 py-2 px-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          {image.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          {image.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(image)}
                          disabled={isBusy}
                          className="py-2 px-3 rounded-xl border border-destructive/20 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProductImageLibrary;
