import { useState, useEffect, useRef } from 'react';
import { useClient } from '@/contexts/ClientContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  X, 
  Minus, 
  Send, 
  Loader2,
  Copy,
  Trash2,
  Check
} from 'lucide-react';
import { getClientColor } from '@/lib/clientColors';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function FloatingChatBot() {
  const { client } = useClient();
  const clientColor = client ? getClientColor(client.id) : { primary: '#6366f1', light: '#e0e7ff', dark: '#4338ca' };
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar historial del servidor (persistent)
  useEffect(() => {
    if (client) {
      const loadHistory = async () => {
        try {
          const response = await fetch(`/api/chat/${client.id}/history?limit=100`);
          if (response.ok) {
            const data = await response.json();
            if (data.messages && data.messages.length > 0) {
              setMessages(data.messages.map((m: any) => ({
                role: m.role,
                content: m.content,
                timestamp: new Date(m.timestamp)
              })));
            } else {
              // Mensaje de bienvenida si no hay historial
              setMessages([{
                role: 'assistant',
                content: `¡Hola! Soy tu asistente legal para el caso de ${client.name}. ¿En qué puedo ayudarte hoy?`,
                timestamp: new Date()
              }]);
            }
          } else {
            // Fallback a localStorage si el servidor falla
            const savedMessages = localStorage.getItem(`chat-history-${client.id}`);
            if (savedMessages) {
              const parsed = JSON.parse(savedMessages);
              setMessages(parsed.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp)
              })));
            } else {
              setMessages([{
                role: 'assistant',
                content: `¡Hola! Soy tu asistente legal para el caso de ${client.name}. ¿En qué puedo ayudarte hoy?`,
                timestamp: new Date()
              }]);
            }
          }
        } catch (error) {
          console.error('Error loading chat history from server:', error);
          // Fallback a localStorage
          const savedMessages = localStorage.getItem(`chat-history-${client.id}`);
          if (savedMessages) {
            const parsed = JSON.parse(savedMessages);
            setMessages(parsed.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            })));
          } else {
            setMessages([{
              role: 'assistant',
              content: `¡Hola! Soy tu asistente legal para el caso de ${client.name}. ¿En qué puedo ayudarte hoy?`,
              timestamp: new Date()
            }]);
          }
        }
      };
      
      loadHistory();
    }
  }, [client]);

  // Guardar historial en localStorage
  useEffect(() => {
    if (client && messages.length > 0) {
      localStorage.setItem(`chat-history-${client.id}`, JSON.stringify(messages));
    }
  }, [messages, client]);



  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Focus en input al abrir
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !client) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch(`/api/chat/${client.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        let serverMessage = 'Error en la respuesta del servidor';
        try {
          const contentType = response.headers.get('content-type') ?? '';
          if (contentType.includes('application/json')) {
            const errorPayload = await response.json();
            serverMessage = errorPayload?.error || errorPayload?.message || serverMessage;
          } else {
            const rawText = await response.text();
            if (rawText) {
              serverMessage = rawText.slice(0, 200);
            }
          }
        } catch (parseError) {
          console.error('No se pudo leer el error del servidor', parseError);
        }
        throw new Error(serverMessage);
      }

      const responseType = response.headers.get('content-type') ?? '';
      if (!responseType.includes('application/json')) {
        const rawText = await response.text();
        throw new Error(
          rawText
            ? `Respuesta inválida del servidor: ${rawText.slice(0, 120)}`
            : 'El servidor devolvió una respuesta no reconocida.',
        );
      }

      const data = await response.json();
      
      if (!data.response) {
        throw new Error('No se recibió respuesta válida');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el mensaje. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const copyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    toast({
      title: "Copiado",
      description: "Mensaje copiado al portapapeles"
    });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clearChat = async () => {
    if (client) {
      // Clear localStorage backup
      localStorage.removeItem(`chat-history-${client.id}`);
      
      // Clear server-side history
      try {
        await fetch(`/api/chat/${client.id}/history`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Failed to clear server history:', error);
      }
      
      setMessages([{
        role: 'assistant',
        content: `¡Hola! Soy tu asistente legal para el caso de ${client.name}. ¿En qué puedo ayudarte hoy?`,
        timestamp: new Date()
      }]);
      toast({
        title: "Chat limpiado",
        description: "El historial de conversación ha sido eliminado"
      });
    }
  };

  if (!client) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-20 w-20 rounded-full shadow-2xl hover:scale-110 transition-transform hover:shadow-3xl ring-4 ring-white/20"
          style={{ 
            backgroundColor: clientColor.primary,
            zIndex: 9999
          }}
          title="Abrir asistente de IA"
        >
          <MessageCircle className="h-9 w-9 text-white" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card
          className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-96 shadow-2xl transition-all border-4 sm:rounded-lg rounded-none"
          style={{ 
            height: isMinimized ? '60px' : 'calc(100vh - 64px)',
            maxHeight: isMinimized ? '60px' : '600px',
            borderColor: clientColor.primary,
            zIndex: 9999
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 border-b cursor-pointer"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="flex items-center gap-3">
              <Avatar 
                className="h-8 w-8"
                style={{ backgroundColor: clientColor.primary }}
              >
                <AvatarFallback className="text-white">DJ</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">Dr. Juro Assistant</h3>
                <p className="text-xs text-muted-foreground">{client.name}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <ScrollArea className="h-[calc(600px-140px)] p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar 
                        className="h-8 w-8 flex-shrink-0"
                        style={message.role === 'assistant' ? { backgroundColor: clientColor.light, color: clientColor.dark } : { backgroundColor: clientColor.primary }}
                      >
                        <AvatarFallback 
                          className={message.role === 'assistant' ? '' : 'text-white'}
                        >
                          {message.role === 'user' ? 'Tú' : 'DJ'}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                        <div
                          className={`rounded-lg p-3 max-w-[80%] group relative ${
                            message.role === 'user'
                              ? 'text-white'
                              : 'bg-muted'
                          }`}
                          style={message.role === 'user' ? { backgroundColor: clientColor.primary } : undefined}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyMessage(message.content, index)}
                          >
                            {copiedIndex === index ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 px-1">
                          {message.timestamp.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-3">
                      <Avatar 
                        className="h-8 w-8"
                        style={{ backgroundColor: clientColor.primary }}
                      >
                        <AvatarFallback className="text-white">DJ</AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="border-t p-4 space-y-2">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Escribe tu mensaje..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    style={!isLoading && input.trim() ? { backgroundColor: clientColor.primary, color: 'white' } : undefined}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearChat}
                    className="text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Limpiar chat
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </>
  );
}
