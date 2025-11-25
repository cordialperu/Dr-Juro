import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Hash, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";

interface TagManagerProps {
  caseId: string;
  currentTags: string[];
  onTagsChange?: (tags: string[]) => void;
}

interface Note {
  id: string;
  tags: string[];
}

export default function TagManager({ caseId, currentTags, onTagsChange }: TagManagerProps) {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all available tags for this case from notes
  const { data: availableTags = [] } = useQuery<string[]>({
    queryKey: ["/api/cases", caseId, "notes", "tags"],
  });

  // Update case tags
  const updateCaseTagsMutation = useMutation({
    mutationFn: async (newTags: string[]) => {
      const response = await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: newTags }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update tags");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId] });
      onTagsChange?.(data.tags);
      toast({
        title: "Tags actualizados",
        description: "Los tags del caso se han actualizado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron actualizar los tags.",
        variant: "destructive",
      });
    },
  });

  const getTagColor = (tag: string) => {
    const colors = [
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    ];
    const hash = tag.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (!trimmedTag) return;
    
    if (currentTags.includes(trimmedTag)) {
      toast({
        title: "Tag duplicado",
        description: "Este tag ya existe en el caso.",
        variant: "default",
      });
      return;
    }

    const newTags = [...currentTags, trimmedTag];
    updateCaseTagsMutation.mutate(newTags);
    setInputValue("");
    setOpen(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = currentTags.filter((tag) => tag !== tagToRemove);
    updateCaseTagsMutation.mutate(newTags);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag(inputValue);
    }
  };

  const suggestedTags = availableTags.filter(
    (tag) => !currentTags.includes(tag) && tag.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Tags del Caso</CardTitle>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar tag
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <Command>
                <CommandInput
                  placeholder="Buscar o crear tag..."
                  value={inputValue}
                  onValueChange={setInputValue}
                  onKeyDown={handleKeyDown}
                />
                <CommandList>
                  {inputValue && (
                    <CommandGroup heading="Crear nuevo">
                      <CommandItem
                        onSelect={() => handleAddTag(inputValue)}
                        className="cursor-pointer"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Crear "{inputValue}"
                      </CommandItem>
                    </CommandGroup>
                  )}
                  {suggestedTags.length > 0 && (
                    <CommandGroup heading="Tags existentes">
                      {suggestedTags.slice(0, 10).map((tag) => (
                        <CommandItem
                          key={tag}
                          onSelect={() => handleAddTag(tag)}
                          className="cursor-pointer"
                        >
                          <Hash className="h-4 w-4 mr-2" />
                          {tag}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {!inputValue && suggestedTags.length === 0 && (
                    <CommandEmpty>Escribe para crear un nuevo tag</CommandEmpty>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {currentTags.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay tags en este caso</p>
            <p className="text-xs mt-1">Agrega tags para organizar y categorizar</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {currentTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className={`${getTagColor(tag)} gap-1 pr-1`}
              >
                {tag}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleRemoveTag(tag)}
                  disabled={updateCaseTagsMutation.isPending}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
        {updateCaseTagsMutation.isPending && (
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Actualizando tags...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
