import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-gold">404</h1>
        <p className="mt-4 text-sand">Página não encontrada.</p>
        <Link to="/" className="mt-6 inline-block bg-gradient-tropical text-tropical-foreground px-6 py-3 rounded-full">
          Voltar
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl text-gold">Algo deu errado</h1>
        <p className="mt-2 text-sand text-sm">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 bg-gradient-tropical text-tropical-foreground px-6 py-3 rounded-full">
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Baile do Havaí — 04/07/2026" },
      { name: "description", content: "Ingressos para o Baile do Havaí no COB Boa Vista." },
      { property: "og:title", content: "Baile do Havaí — 04/07/2026" },
      { name: "twitter:title", content: "Baile do Havaí — 04/07/2026" },
      { property: "og:description", content: "Ingressos para o Baile do Havaí no COB Boa Vista." },
      { name: "twitter:description", content: "Ingressos para o Baile do Havaí no COB Boa Vista." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1ab51bff-2af2-447b-8186-c9d9d71fc1ac/id-preview-846b1792--8fbfbb7d-4af3-498a-8e49-16b5194e1513.lovable.app-1780419017995.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1ab51bff-2af2-447b-8186-c9d9d71fc1ac/id-preview-846b1792--8fbfbb7d-4af3-498a-8e49-16b5194e1513.lovable.app-1780419017995.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSync />
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}

function AuthSync() {
  const router = useRouter();
  const qc = useQueryClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      qc.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, qc]);
  return null;
}
