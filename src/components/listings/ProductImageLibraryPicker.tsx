import React, { useMemo, useState } from 'react';
import { Search, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ProductImageLibraryItem } from '@/types';

interface ProductImageLibraryPickerProps {
  images: ProductImageLibraryItem[];
  selectedImageId?: string | null;
  onSelect: (image: ProductImageLibraryItem) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export const ProductImageLibraryPicker: React.FC<ProductImageLibraryPickerProps> = ({
  images,
  selectedImageId,
  onSelect,
  loading = false,
  emptyMessage = 'No library images available yet.',
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(images.map((image) => image.category).filter(Boolean) as string[])).sort()],
    [images]
  );

  const filteredImages = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return images.filter((image) => {
      const matchesSearch =
        !searchLower ||
        image.name.toLowerCase().includes(searchLower) ||
        image.category?.toLowerCase().includes(searchLower);
      const matchesCategory = category === 'All' || image.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [category, images, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search produce images..."
            className="pl-9"
          />
        </div>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="px-4 py-2 bg-card border border-border rounded-lg text-foreground"
        >
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="p-8 border border-dashed border-border rounded-2xl text-center">
          <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading image library...</p>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="p-8 border border-dashed border-border rounded-2xl text-center">
          <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredImages.map((image) => {
            const isSelected = selectedImageId === image.id;
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => onSelect(image)}
                className={`text-left rounded-2xl overflow-hidden border transition-all ${
                  isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="aspect-square bg-muted">
                  <img src={image.imageUrl} alt={image.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm text-foreground truncate">{image.name}</p>
                  <p className="text-xs text-muted-foreground">{image.category || 'Uncategorized'}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
