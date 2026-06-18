import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [{ title: "Recuperar Senha — Baile do Havaí" }, { name: "robots", content: "noindex" }],
  }),
  component: RecuperarSenha,
});

function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Email enviado! Verifique sua caixa de entrada.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 space-y-4">
        <h1 className="font-display text-3xl text-gold text-center">RECUPERAR SENHA</h1>
        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-sand text-sm">
              Enviamos um link de recuperação para <strong>{email}</strong>. Verifique sua caixa de entrada e spam.
            </p>
            <Link
              to="/admin/login"
              className="inline-block bg-gradient-tropical text-tropical-foreground px-6 py-3 rounded-xl font-display tracking-wider"
            >
              VOLTAR AO LOGIN
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sand text-sm text-center">
              Digite seu email e enviaremos um link para redefinir sua senha.
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-input border border-border rounded-xl px-4 py-3"
            />
            <button
              disabled={loading}
              className="w-full bg-gradient-tropical text-tropical-foreground py-3 rounded-xl font-display tracking-wider"
            >
              {loading ? "..." : "ENVIAR LINK"}
            </button>
            <div className="text-center">
              <Link to="/admin/login" className="text-sand text-sm underline">
                Voltar ao login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
