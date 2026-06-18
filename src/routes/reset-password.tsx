import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Redefinir Senha — Baile do Havaí" }, { name: "robots", content: "noindex" }],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [hashChecked, setHashChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setHashChecked(true);
    } else {
      setHashChecked(true);
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast.success("Senha redefinida com sucesso!");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!hashChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-sand">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 space-y-4">
        <h1 className="font-display text-3xl text-gold text-center">NOVA SENHA</h1>
        {done ? (
          <div className="space-y-4 text-center">
            <p className="text-sand text-sm">Sua senha foi redefinida com sucesso!</p>
            <Link
              to="/admin/login"
              className="inline-block bg-gradient-tropical text-tropical-foreground px-6 py-3 rounded-xl font-display tracking-wider"
            >
              IR PARA O LOGIN
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sand text-sm text-center">Digite sua nova senha abaixo.</p>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nova senha"
              className="w-full bg-input border border-border rounded-xl px-4 py-3"
            />
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar nova senha"
              className="w-full bg-input border border-border rounded-xl px-4 py-3"
            />
            <button
              disabled={loading}
              className="w-full bg-gradient-tropical text-tropical-foreground py-3 rounded-xl font-display tracking-wider"
            >
              {loading ? "..." : "REDEFINIR SENHA"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
