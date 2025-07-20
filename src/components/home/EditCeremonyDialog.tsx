'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Ceremony } from '@/types';
import { updateCeremony } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Trash } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  price: z.string().min(1, 'El precio es requerido'),
  link: z.string().url('Debe ser una URL válida'),
  featured: z.boolean(),
  features: z.array(z.object({ value: z.string().min(1, 'La característica no puede estar vacía') })),
});

type EditCeremonyFormValues = z.infer<typeof formSchema>;

interface EditCeremonyDialogProps {
  ceremony: Ceremony;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (ceremony: Ceremony) => void;
}

export default function EditCeremonyDialog({ ceremony, isOpen, onClose, onUpdate }: EditCeremonyDialogProps) {
  const { toast } = useToast();
  const form = useForm<EditCeremonyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: ceremony.title,
      description: ceremony.description,
      price: ceremony.price,
      link: ceremony.link,
      featured: ceremony.featured,
      features: ceremony.features.map(f => ({ value: f })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "features"
  });

  const onSubmit = async (data: EditCeremonyFormValues) => {
    try {
      const updatedData: Ceremony = {
        ...ceremony,
        ...data,
        features: data.features.map(f => f.value),
      };
      await updateCeremony(updatedData);
      onUpdate(updatedData);
      toast({
        title: '¡Éxito!',
        description: 'La ceremonia ha sido actualizada.',
      });
      onClose();
    } catch (error) {
       toast({
        title: 'Error',
        description: 'No se pudo actualizar la ceremonia.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card">
        <DialogHeader>
          <DialogTitle>Editar Ceremonia</DialogTitle>
          <DialogDescription>
            Realiza cambios en los detalles de la ceremonia. Haz clic en guardar cuando termines.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Título</Label>
            <Input id="title" {...form.register('title')} className="col-span-3" />
             {form.formState.errors.title && <p className="col-span-4 text-red-500 text-xs text-right">{form.formState.errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Descripción</Label>
            <Textarea id="description" {...form.register('description')} className="col-span-3" />
            {form.formState.errors.description && <p className="col-span-4 text-red-500 text-xs text-right">{form.formState.errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">Precio</Label>
            <Input id="price" {...form.register('price')} className="col-span-3" />
            {form.formState.errors.price && <p className="col-span-4 text-red-500 text-xs text-right">{form.formState.errors.price.message}</p>}
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="link" className="text-right">Enlace</Label>
            <Input id="link" {...form.register('link')} className="col-span-3" />
            {form.formState.errors.link && <p className="col-span-4 text-red-500 text-xs text-right">{form.formState.errors.link.message}</p>}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="features" className="text-right">Características</Label>
             <div className="col-span-3 space-y-2">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                        <Input {...form.register(`features.${index}.value`)} />
                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash className="h-4 w-4"/></Button>
                    </div>
                ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => append({ value: "" })}>
                    Añadir característica
                </Button>
             </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="featured" className="text-right">Destacado</Label>
            <Checkbox id="featured" {...form.register('featured')} className="col-span-3 justify-self-start" />
          </div>

          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
