import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: { id: string };
}

export default function TransactionCommsPage({ params }: PageProps) {
  const messages = [
    { id: "1", author: "Alessandro (IT)", content: "Ciao, l'offerta è stata accettata.", translated: "Hi, the offer has been accepted." },
    { id: "2", author: "Sarah (EN)", content: "Great! What are the next steps?", translated: "Ottimo! Quali sono i prossimi passi?" },
  ];

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Comms — Transaction #{params.id}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Message Thread (Preview)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {messages.map(m => (
              <div key={m.id} className="rounded border p-3">
                <div className="text-sm font-medium">{m.author}</div>
                <div className="text-sm mt-1">{m.translated}</div>
                <div className="text-xs text-muted-foreground mt-1">Show original: {m.content}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t">
            <Input placeholder="Type a message (translations coming soon)" />
            <Button disabled>Send</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

