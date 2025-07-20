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
import { addCeremony, updateCeremony, deleteCeremony } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Copy, Trash } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

const formSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  price: z.string().min(1, 'El precio es requerido'),
  link: z.string().url('Debe ser una URL válida'),
  featured: z.boolean(),
  features: z.array(z.object({ value: z.string().min(1, 'La característica no puede estar vacía') })),
  mediaUrl: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
  mediaType: z.enum(['image', 'video']).default('image'),
});

type EditCeremonyFormValues = z.infer<typeof formSchema>;

interface EditCeremonyDialogProps {
  ceremony: Ceremony | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (ceremony: Ceremony) => void;
  onAdd: (ceremony: Ceremony) => void;
  onDelete: (id: string) => void;
  onDuplicate: (ceremony: Ceremony) => void;
}

export default function EditCeremonyDialog({ ceremony, isOpen, onClose, onUpdate, onAdd, onDelete, onDuplicate }: EditCeremonyDialogProps) {
  const { toast } = useToast();
  const isEditMode = !!ceremony;

  const form = useForm<EditCeremonyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditMode ? {
      title: ceremony.title,
      description: ceremony.description,
      price: ceremony.price,
      link: ceremony.link,
      featured: ceremony.featured,
      features: ceremony.features.map(f => ({ value: f })),
      mediaUrl: ceremony.mediaUrl || '',
      mediaType: ceremony.mediaType || 'image',
    } : {
      title: '',
      description: '',
      price: '',
      link: 'https://wa.me/50670519145',
      featured: false,
      features: [{ value: 'Alimentación'}, {value: 'Estadía'}],
      mediaUrl: '',
      mediaType: 'image',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "features"
  });

  const onSubmit = async (data: EditCeremonyFormValues) => {
    try {
      if (isEditMode && ceremony) {
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
      } else {
        const newData: Omit<Ceremony, 'id'> = {
           ...data,
           features: data.features.map(f => f.value),
        }
        const newId = await addCeremony(newData);
        onAdd({ ...newData, id: newId });
         toast({
          title: '¡Éxito!',
          description: 'La ceremonia ha sido creada.',
        });
      }
      onClose();
    } catch (error) {
       toast({
        title: 'Error',
        description: `No se pudo ${isEditMode ? 'actualizar' : 'crear'} la ceremonia.`,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!ceremony) return;
    try {
      await deleteCeremony(ceremony.id);
      onDelete(ceremony.id);
      toast({
        title: '¡Eliminada!',
        description: 'La ceremonia ha sido eliminada.',
      });
      onClose();
    } catch (error) {
       toast({
        title: 'Error',
        description: 'No se pudo eliminar la ceremonia.',
        variant: 'destructive',
      });
    }
  }

  const handleDuplicate = async () => {
    if (!ceremony) return;
    try {
      const { id, ...originalData } = ceremony;
      const duplicatedData: Omit<Ceremony, 'id'> = {
        ...originalData,
        title: `${originalData.title} (Copia)`,
        featured: false, // Duplicates are not featured by default
      };
      const newId = await addCeremony(duplicatedData);
      onDuplicate({ ...duplicatedData, id: newId });
      toast({
        title: '¡Duplicada!',
        description: 'La ceremonia ha sido duplicada.',
      });
      onClose();
    } catch (error) {
       toast({
        title: 'Error',
        description: 'No se pudo duplicar la ceremonia.',
        variant: 'destructive',
      });
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Ceremonia' : 'Añadir Ceremonia'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Realiza cambios en los detalles de la ceremonia.' : 'Añade una nueva ceremonia a la lista.'}
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
            <Label htmlFor="mediaUrl" className="text-right">URL de Media</Label>
            <Input id="mediaUrl" {...form.register('mediaUrl')} className="col-span-3" placeholder="https://example.com/image.png" />
            {form.formState.errors.mediaUrl && <p className="col-span-4 text-red-500 text-xs text-right">{form.formState.errors.mediaUrl.message}</p>}
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mediaType" className="text-right">Tipo de Media</Label>
            <Select onValueChange={(value) => form.setValue('mediaType', value as 'image' | 'video')} defaultValue={form.getValues('mediaType')}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Imagen</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
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
            <Checkbox id="featured" checked={form.watch('featured')} onCheckedChange={(checked) => form.setValue('featured', !!checked)} className="col-span-3 justify-self-start" />
          </div>

          <DialogFooter className="justify-between">
            <div>
              {isEditMode && (
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive">
                        <Trash className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente la ceremonia.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Continuar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button type="button" variant="outline" onClick={handleDuplicate}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicar
                  </Button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
