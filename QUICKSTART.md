# 🚀 Dr. Juro - Guía Rápida de Despliegue

## ✅ Opción Más Fácil: Replit (100% Gratis)

### 1️⃣ Preparación (5 minutos)

**Obtén tus API Keys:**

a) **Gemini (Gratis)**:
   - Ve a: https://ai.google.dev
   - Inicia sesión con Google
   - Crea una API Key
   - Cópiala y guárdala

b) **OpenAI** ($5 mínimo):
   - Ve a: https://platform.openai.com
   - Crea cuenta y agrega créditos
   - Genera API Key
   - Cópiala y guárdala

c) **Neon Database (Gratis)**:
   - Ve a: https://neon.tech
   - Crea cuenta
   - Crea proyecto "drjuro"
   - Copia la "Connection String"
   - Guárdala

### 2️⃣ Despliegue en Replit (10 minutos)

1. **Sube tu código a GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin tu-repositorio
   git push -u origin main
   ```

2. **Crea Repl**:
   - Ve a https://replit.com
   - Click "+ Create Repl"
   - Selecciona "Import from GitHub"
   - Pega la URL de tu repositorio

3. **Configura Secrets** (en Replit):
   - Click en el candado 🔒 (Secrets)
   - Agrega estas 3 variables:

   ```
   GEMINI_API_KEY=tu-key-de-gemini-aqui
   OPENAI_API_KEY=tu-key-de-openai-aqui  
   DATABASE_URL=tu-connection-string-de-neon
   ```

4. **Ejecuta**:
   - Click en "Run" ▶️
   - Espera que compile e instale
   - ¡Listo! Tendrás una URL pública

### 3️⃣ Comparte la URL

La URL será algo como:
```
https://drjuro-tu-usuario.replit.app
```

**¡Compártela con tu equipo!** Funcionará desde cualquier navegador.

---

## 🔄 Alternativa: Railway (También Gratis)

Si Replit no funciona, prueba Railway:

1. Ve a https://railway.app
2. Conecta tu GitHub
3. Crea nuevo proyecto → Import Repo
4. Agrega las 3 variables de entorno
5. Despliega

---

## ⚙️ Variables de Entorno Requeridas

```env
# Gemini API (Búsqueda de jurisprudencia) - GRATIS
GEMINI_API_KEY=AIza...

# OpenAI API (Análisis de documentos) - $5 mínimo
OPENAI_API_KEY=sk-...

# Base de datos PostgreSQL - GRATIS con Neon
DATABASE_URL=postgresql://user:pass@host.neon.tech/drjuro
```

---

## 📝 Checklist

- [ ] Cuenta de Gemini creada y API Key copiada
- [ ] Cuenta de OpenAI con créditos y API Key copiada  
- [ ] Base de datos Neon creada y Connection String copiada
- [ ] Código subido a GitHub
- [ ] Repl creado e importado desde GitHub
- [ ] 3 secrets configurados en Replit
- [ ] App corriendo (presiona Run ▶️)
- [ ] URL pública funcionando
- [ ] URL compartida con el equipo ✅

---

## 🆘 Problemas Comunes

### "Failed to connect to database"
→ Verifica que la `DATABASE_URL` de Neon sea correcta

### "OpenAI API error" 
→ Verifica que tengas créditos en tu cuenta OpenAI

### "Module not found"
→ En Replit, click "Shell" y ejecuta: `npm install`

---

## 💰 Costos

- **Neon Database**: GRATIS (10 GB)
- **Gemini API**: GRATIS (límites generosos)
- **OpenAI API**: ~$5-10/mes (depende del uso)
- **Replit**: GRATIS (con Always-On opcional: $7/mes)

**Total mensual**: $5-10 aprox.

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Replit (pestaña "Console")
2. Verifica que las 3 variables estén configuradas
3. Prueba hacer "Stop" y luego "Run" de nuevo

---

## 🎉 ¡Listo!

Tu app Dr. Juro estará disponible 24/7 en internet, accesible desde cualquier dispositivo.

**URL de ejemplo**: https://drjuro-usuario.replit.app
