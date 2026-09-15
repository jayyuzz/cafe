import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatRupiah } from "@/lib/utils";
import { Check } from "lucide-react";

interface ProductModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: any, variant?: any, addons?: any[]) => void;
}

export function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedAddons([]);
      if (product?.product_variants?.length > 0) {
        setSelectedVariant(product.product_variants[0]);
      } else {
        setSelectedVariant(null);
      }
    }
  }, [isOpen, product]);

  if (!product) return null;

  const handleToggleAddon = (addon: any) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.id === addon.id);
      if (exists) return prev.filter(a => a.id !== addon.id);
      return [...prev, addon];
    });
  };

  const handleAddToCart = () => {
    onAddToCart(product, selectedVariant, selectedAddons);
    onClose();
  };

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + Number(a.price), 0);
  const currentTotal = product.price + (selectedVariant?.additional_price || 0) + addonsTotal;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {product.product_variants && product.product_variants.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Pilih Varian (Wajib)</h4>
              <div className="grid grid-cols-2 gap-2">
                {product.product_variants.map((variant: any) => (
                  <Button
                    key={variant.id}
                    variant={selectedVariant?.id === variant.id ? "default" : "outline"}
                    className="justify-between h-auto py-2 px-3"
                    onClick={() => setSelectedVariant(variant)}
                  >
                    <span>{variant.name}</span>
                    {variant.additional_price > 0 && (
                      <span className="text-xs opacity-80">+{formatRupiah(variant.additional_price)}</span>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {product.product_addons && product.product_addons.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Tambahan / Add-on (Opsional)</h4>
              <div className="grid grid-cols-1 gap-2">
                {product.product_addons.map((addon: any) => {
                  const isSelected = selectedAddons.some(a => a.id === addon.id);
                  return (
                    <Button
                      key={addon.id}
                      variant={isSelected ? "default" : "outline"}
                      className="justify-between h-auto py-2 px-3"
                      onClick={() => handleToggleAddon(addon)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center justify-center w-4 h-4 rounded border ${isSelected ? 'bg-primary-foreground text-primary border-primary-foreground' : 'border-input'}`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span>{addon.name}</span>
                      </div>
                      <span className="text-xs opacity-80">+{formatRupiah(addon.price)}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleAddToCart} className="w-full">
            Tambah ke Pesanan - {formatRupiah(currentTotal)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
