"use client"

import { useState, useEffect } from "react"
import { Loader2, MessageSquare, Image as ImageIcon, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CadenceMessage, MessageType } from "@/lib/whatsapp/types"

interface FormData {
  type: MessageType;
  content: string;
  orderNumber: number;
}

interface MessageFormProps {
  message?: CadenceMessage;
  onSave: (data: FormData) => Promise<void>;
  onCancel: () => void;
  existingOrders: number[];
  open: boolean;
}

export function MessageForm({ message, onSave, onCancel, existingOrders, open }: MessageFormProps) {
  const [type, setType] = useState<MessageType>('text');
  const [content, setContent] = useState('');
  const [orderNumber, setOrderNumber] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!message;

  // Reset form when dialog opens or message changes
  useEffect(() => {
    if (open) {
      if (message) {
        setType(message.type);
        setContent(message.content);
        setOrderNumber(message.orderNumber);
      } else {
        setType('text');
        setContent('');
        setOrderNumber(Math.max(0, ...existingOrders) + 1);
      }
      setError(null);
    }
  }, [message, open, existingOrders]);

  const validateForm = (): boolean => {
    if (!content.trim()) {
      setError('O conteúdo é obrigatório.');
      return false;
    }

    if (type === 'text') {
      if (content.trim().length === 0) {
        setError('O texto não pode ser vazio.');
        return false;
      }
    } else {
      try {
        const url = new URL(content);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          setError('A URL deve começar com http:// ou https://');
          return false;
        }
      } catch {
        setError('URL inválida.');
        return false;
      }
    }

    if (orderNumber < 1) {
      setError('A ordem deve ser maior que 0.');
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSave({ type, content, orderNumber });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (t: MessageType) => {
    switch (t) {
      case 'text': return <MessageSquare className="h-4 w-4" />;
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
    }
  };

  const getContentLabel = () => {
    switch (type) {
      case 'text': return 'Texto da Mensagem';
      case 'image': return 'URL da Imagem';
      case 'video': return 'URL do Vídeo';
    }
  };

  const getContentPlaceholder = () => {
    switch (type) {
      case 'text': return 'Digite o texto da mensagem...';
      case 'image': return 'https://exemplo.com/imagem.jpg';
      case 'video': return 'https://exemplo.com/video.mp4';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Mensagem' : 'Nova Mensagem'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Edite os campos abaixo para atualizar a mensagem.'
              : 'Preencha os campos abaixo para adicionar uma nova mensagem à cadência.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Mensagem</Label>
            <Select value={type} onValueChange={(v) => setType(v as MessageType)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Texto
                  </div>
                </SelectItem>
                <SelectItem value="image">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Imagem
                  </div>
                </SelectItem>
                <SelectItem value="video">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Vídeo
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              {getTypeIcon(type)}
              {getContentLabel()}
            </Label>
            {type === 'text' ? (
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={getContentPlaceholder()}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            ) : (
              <Input 
                placeholder={getContentPlaceholder()} 
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            )}
            {type === 'text' && (
              <p className="text-xs text-muted-foreground">
                Variáveis disponíveis: <code className="bg-muted px-1 rounded">{'{nome}'}</code> (primeiro nome), <code className="bg-muted px-1 rounded">{'{nome_completo}'}</code>, <code className="bg-muted px-1 rounded">{'{data_assinatura}'}</code>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Ordem na Sequência</Label>
            <Input 
              type="number" 
              min={1} 
              value={orderNumber}
              onChange={(e) => setOrderNumber(parseInt(e.target.value) || 1)}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Adicionar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
