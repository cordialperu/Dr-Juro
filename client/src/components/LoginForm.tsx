import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);

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
    <Card className="w-full max-w-md border-0 shadow-2xl">
      <CardHeader className="space-y-3 pb-8">
        <CardTitle className="text-2xl font-light text-center tracking-tight">
          {isRegisterMode ? "Crear cuenta" : "Iniciar sesión"}
        </CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          {isRegisterMode 
            ? "Ingresa tus datos para crear una cuenta" 
            : "Ingresa tus credenciales para continuar"
          }
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">
              Usuario
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="username" 
                autoComplete="username" 
                className="pl-10 h-11"
                placeholder="Tu usuario"
                {...form.register("username")} 
              />
            </div>
            {form.formState.errors.username && (
              <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="pl-10 pr-10 h-11"
                placeholder="••••••••"
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button 
            type="submit" 
            className="w-full h-11 font-medium" 
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (isRegisterMode ? "Creando cuenta..." : "Ingresando...") 
              : (isRegisterMode ? "Crear cuenta" : "Ingresar")
            }
          </Button>
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">o</span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 font-normal"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              form.clearErrors();
            }}
          >
            {isRegisterMode 
              ? "Ya tengo cuenta" 
              : "Crear cuenta nueva"
            }
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
