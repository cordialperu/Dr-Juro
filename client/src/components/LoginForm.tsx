import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLoginMutation, useRegisterMutation } from "@/hooks/useAuth";

const loginSchema = z.object({
  username: z.string().min(3, "Ingresa tu usuario"),
  password: z.string().min(6, "Ingresa tu contraseña"),
});

type LoginValues = z.infer<typeof loginSchema>;

type LoginFormProps = {
  onSuccess?: () => void;
};

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    const mutation = isRegisterMode ? registerMutation : loginMutation;
    
    mutation.mutate(values, {
      onSuccess: (profile) => {
        toast({
          title: isRegisterMode ? "Cuenta creada" : "Sesión iniciada",
          description: `Bienvenido ${profile.username}`,
        });
        form.reset();
        onSuccess?.();
      },
      onError: (error) => {
        toast({
          title: isRegisterMode ? "Error al crear cuenta" : "Error de autenticación",
          description: error.message,
          variant: "destructive",
        });
      },
      onSettled: () => {
        setIsSubmitting(false);
      },
    });
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          {isRegisterMode ? "Crear cuenta" : "Iniciar sesión"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Usuario</Label>
            <Input id="username" autoComplete="username" {...form.register("username")} />
            {form.formState.errors.username && (
              <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting 
              ? (isRegisterMode ? "Creando cuenta..." : "Ingresando...") 
              : (isRegisterMode ? "Crear cuenta" : "Ingresar")
            }
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              form.clearErrors();
            }}
          >
            {isRegisterMode 
              ? "¿Ya tienes cuenta? Inicia sesión" 
              : "¿No tienes cuenta? Regístrate"
            }
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
