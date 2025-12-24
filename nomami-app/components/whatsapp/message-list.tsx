"use client"

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { GripVertical, Pencil, Trash2, MessageSquare, Image as ImageIcon, Video } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CadenceMessage, MessageType } from '@/lib/whatsapp/types';

interface MessageListProps {
  messages: CadenceMessage[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (messageIds: string[]) => void;
}

function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

function getTypeIcon(type: MessageType) {
  switch (type) {
    case 'text': return <MessageSquare className="h-4 w-4" />;
    case 'image': return <ImageIcon className="h-4 w-4" />;
    case 'video': return <Video className="h-4 w-4" />;
  }
}

function getTypeBadge(type: MessageType) {
  const labels = { text: 'Texto', image: 'Imagem', video: 'Vídeo' };
  const variants = { text: 'default', image: 'secondary', video: 'outline' } as const;
  return (
    <Badge variant={variants[type]} className="flex items-center gap-1">
      {getTypeIcon(type)}
      {labels[type]}
    </Badge>
  );
}

interface SortableMessageItemProps {
  message: CadenceMessage;
  onEdit: (id: string) => void;
  onDeleteClick: (id: string) => void;
}

function SortableMessageItem({ message, onEdit, onDeleteClick }: SortableMessageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: message.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`mb-2 ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <button
              className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  #{message.orderNumber}
                </span>
                {getTypeBadge(message.type)}
              </div>
              <p className="text-sm text-foreground break-words">
                {message.type === 'text' 
                  ? truncateText(message.content)
                  : <a href={message.content} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">{truncateText(message.content, 50)}</a>
                }
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(message.id)}
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteClick(message.id)}
                title="Excluir"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function MessageList({ messages, onEdit, onDelete, onReorder }: MessageListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = messages.findIndex((m) => m.id === active.id);
      const newIndex = messages.findIndex((m) => m.id === over.id);
      const reordered = arrayMove(messages, oldIndex, newIndex);
      onReorder(reordered.map((m) => m.id));
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma mensagem configurada.</p>
        <p className="text-sm">Adicione mensagens para criar sua cadência.</p>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext items={messages.map(m => m.id)} strategy={verticalListSortingStrategy}>
          {messages.map((message) => (
            <SortableMessageItem
              key={message.id}
              message={message}
              onEdit={onEdit}
              onDeleteClick={setDeleteId}
            />
          ))}
        </SortableContext>
      </DndContext>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Mensagem</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
