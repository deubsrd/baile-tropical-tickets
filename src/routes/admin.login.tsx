import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Login Admin — Baile do Havaí" }, { name: "robots", content: "noindex" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
      if (error) throw error;
      navigate({ to: "/admin", replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-md bg-card border border-border rounded-2xl p-8 space-y-4">
        <h1 className="font-display text-3xl text-gold text-center">PAINEL ADMIN</h1>
        <p className="text-sand text-sm text-center">
          {mode === "login" ? "Entre com suas credenciais" : "Cadastre-se (1º cadastro vira admin)"}
        </p>
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full bg-input border border-border rounded-xl px-4 py-3"
        />
        <input
          type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          className="w-full bg-input border border-border rounded-xl px-4 py-3"
        />
        <button disabled={loading} className="w-full bg-gradient-tropical text-tropical-foreground py-3 rounded-xl font-display tracking-wider">
          {loading ? "..." : mode === "login" ? "ENTRAR" : "CADASTRAR"}
        </button>
        {mode === "login" && (
          <div className="text-center">
            <Link to="/recuperar-senha" className="text-sand text-sm underline">
              Esqueceu a senha?
            </Link>
          </div>
        )}
        <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="w-full text-sand text-sm underline">
          {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
      </form>
    </div>
  );
}
