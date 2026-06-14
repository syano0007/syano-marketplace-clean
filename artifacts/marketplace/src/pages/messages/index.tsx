import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { MessagingPanel } from "@/components/MessagingPanel";

export default function MessagesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (!user) {
    return (
      <Layout>
        <div className="container max-w-2xl mx-auto py-20 text-center">
          <MessageCircle className="h-14 w-14 mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">{t("messages.login_prompt")}</p>
          <Link href="/login">
            <Button className="mt-4">{t("messages.login_btn")}</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <div
      className="flex flex-col overflow-hidden bg-background text-foreground"
      style={{ height: "100dvh" }}
    >
      <Navbar />
      <main className="flex-1 overflow-hidden flex flex-col min-w-0 min-h-0">
        <div className="flex-1 overflow-hidden flex flex-col p-4 min-h-0 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-4 shrink-0">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">{t("messages.title")}</h1>
          </div>
          <MessagingPanel role="customer" userId={user.id} />
        </div>
      </main>
    </div>
  );
}
