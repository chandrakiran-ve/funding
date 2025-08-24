import { AIChatInterface } from "@/components/ai-chat/ai-chat-interface";

export default function AIAssistantPage() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground">
          Get insights and analysis from your fundraising data using AI
        </p>
      </div>
      
      <div className="flex-1">
        <AIChatInterface />
      </div>
    </div>
  );
}
