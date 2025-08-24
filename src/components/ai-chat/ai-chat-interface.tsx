"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Bot, 
  User, 
  Send, 
  RefreshCw, 
  Loader2, 
  Sparkles,
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/money";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: any;
}

interface AISummary {
  currentFY: string;
  totalFunders: number;
  activeFunders: number;
  totalStates: number;
  totalSchools: number;
  totalProspects: number;
  totalSecured: number;
  totalTarget: number;
  totalPipeline: number;
  lastUpdated: string;
}

export function AIChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize AI agent and get status
  useEffect(() => {
    initializeAI();
  }, []);

  const initializeAI = async () => {
    try {
      setIsInitializing(true);
      const response = await fetch('/api/ai-chat', { method: 'GET' });
      
      if (!response.ok) {
        throw new Error('Failed to initialize AI');
      }

      const data = await response.json();
      setAiSummary(data.summary);
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm your AI assistant for Vision Empower Trust's fundraising platform. I have access to all your fundraising data and can help you with:

• **Performance Analysis** - Track achievement rates and identify trends
• **Funder Insights** - Analyze contribution patterns and relationships  
• **State Performance** - Compare state-wise fundraising metrics
• **Pipeline Management** - Review prospects and conversion rates
• **Strategic Recommendations** - Get data-driven suggestions

I'm currently loaded with data from ${data.summary?.currentFY || 'the current fiscal year'}. What would you like to know?`,
        timestamp: new Date(),
        context: data.summary
      };
      
      setMessages([welcomeMessage]);
      
    } catch (error) {
      console.error('Failed to initialize AI:', error);
      toast.error('Failed to initialize AI assistant');
    } finally {
      setIsInitializing(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          chatHistory: messages.slice(-10) // Send last 10 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      if (data.success && data.message) {
        setMessages(prev => [...prev, {
          ...data.message,
          timestamp: new Date(data.message.timestamp)
        }]);
        
        if (data.context) {
          setAiSummary(data.context);
        }
      } else {
        throw new Error(data.error || 'Unknown error');
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const refreshAIData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ai-chat', { method: 'PUT' });
      
      if (!response.ok) {
        throw new Error('Failed to refresh AI data');
      }

      const data = await response.json();
      setAiSummary(data.summary);
      toast.success('AI data refreshed successfully');
      
    } catch (error) {
      console.error('Failed to refresh AI data:', error);
      toast.error('Failed to refresh AI data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    "What's our current fundraising performance?",
    "Which states are performing best this year?",
    "Show me our top funders and their contributions",
    "How is our pipeline looking?",
    "What are the biggest funding gaps?",
    "Compare this year's performance to last year"
  ];

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing AI Assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* AI Status Card */}
      {aiSummary && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Assistant
                <Badge variant="outline" className="ml-2">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAIData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="font-medium">{aiSummary.activeFunders}</div>
                  <div className="text-muted-foreground">Active Funders</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                <div>
                  <div className="font-medium">{formatMoney(aiSummary.totalSecured)}</div>
                  <div className="text-muted-foreground">Secured</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="font-medium">{formatMoney(aiSummary.totalPipeline)}</div>
                  <div className="text-muted-foreground">Pipeline</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <div>
                  <div className="font-medium">{aiSummary.totalStates}</div>
                  <div className="text-muted-foreground">States</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Chat with AI Assistant</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.role === 'assistant' && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                      {message.role === 'user' && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                      <div className="flex-1">
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                        <div className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <Separator />
          
          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <div className="px-6 py-4">
              <div className="text-sm font-medium mb-2">Suggested questions:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-left justify-start h-auto py-2 px-3"
                    onClick={() => setInputMessage(question)}
                    disabled={isLoading}
                  >
                    <span className="text-xs">{question}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* Message Input */}
          <div className="px-6 py-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about fundraising performance, funders, states, or pipeline..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
