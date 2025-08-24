import { AIChatInterface } from "@/components/ai-chat/ai-chat-interface";
import { Bot, Brain, Sparkles, TrendingUp, BarChart3, Zap } from "lucide-react";

export default function AIAssistantPage() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col p-3 sm:p-6 animate-fade-in">
      <div className="premium-card-hover p-4 sm:p-6 lg:p-10 mb-4 sm:mb-8 bg-gradient-to-br from-primary/8 via-background to-accent/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="relative flex-shrink-0">
            <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-primary via-primary to-accent shadow-xl hover-glow">
              <Bot className="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
          </div>
          <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              AI Assistant
            </h1>
            <div className="flex items-start gap-2">
              <div className="w-1 h-4 sm:h-6 bg-gradient-to-b from-primary to-accent rounded-full flex-shrink-0 mt-1"></div>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground font-semibold leading-relaxed">
                Get intelligent insights and analysis from your fundraising data using advanced AI
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary animate-pulse flex-shrink-0" />
              <span className="status-info">Powered by Advanced Machine Learning</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
          <div className="metric-card-premium hover-lift bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-blue-600/10 border-blue-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                <Brain className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-lg font-bold text-blue-700 dark:text-blue-300">Smart Analysis</div>
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              Ask complex questions about your fundraising data and get intelligent, contextual answers
            </div>
          </div>
          
          <div className="metric-card-premium hover-lift bg-gradient-to-br from-green-500/10 via-green-400/5 to-green-600/10 border-green-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/10">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-lg font-bold text-green-700 dark:text-green-300">Real-time Insights</div>
            </div>
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">
              Get instant, data-driven answers with live analysis of your current fundraising performance
            </div>
          </div>
          
          <div className="metric-card-premium hover-lift bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-purple-600/10 border-purple-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-lg font-bold text-purple-700 dark:text-purple-300">Predictive Analytics</div>
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
              Forecast future trends, identify opportunities, and predict fundraising outcomes
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-6 premium-card bg-gradient-to-r from-muted/30 to-muted/10 border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary">Quick Start Examples</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              "Which states are underperforming this fiscal year?"
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              "Show me our top 5 funders by contribution amount"
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              "What's our pipeline conversion rate?"
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              "Predict our year-end fundraising total"
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 premium-card-hover animate-scale-in">
        <AIChatInterface />
      </div>
    </div>
  );
}
