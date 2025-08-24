import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { aiAgent, ChatMessage } from '@/lib/ai/ai-agent';

export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds timeout for AI responses

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, chatHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('AI Chat request:', { userId, messageLength: message.length, historyLength: chatHistory.length });

    // Process the message through the AI agent
    const response = await aiAgent.processQuery(message, chatHistory);

    // Get data summary
    const dataSummary = await aiAgent.getDataSummary();

    // Create response message
    const responseMessage: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      context: dataSummary
    };

    return NextResponse.json({
      success: true,
      message: responseMessage,
      context: dataSummary
    });

  } catch (error) {
    console.error('AI Chat API error:', error);
    
    return NextResponse.json({
      error: 'Failed to process AI request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return AI agent status and data summary
    const summary = await aiAgent.getDataSummary();
    
    return NextResponse.json({
      success: true,
      status: 'ready',
      summary,
      capabilities: [
        'Analyze fundraising performance across states and fiscal years',
        'Provide insights on funder relationships and contribution patterns',
        'Track progress against targets and identify shortfalls',
        'Analyze pipeline prospects and conversion rates',
        'Compare performance across different time periods',
        'Identify top-performing states and funders',
        'Suggest strategies for improving fundraising outcomes'
      ]
    });

  } catch (error) {
    console.error('AI Chat status error:', error);
    
    return NextResponse.json({
      error: 'Failed to get AI status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Endpoint to refresh AI agent data
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Refreshing AI agent data...');
    await aiAgent.refreshContext();
    
    const summary = await aiAgent.getDataSummary();
    
    return NextResponse.json({
      success: true,
      message: 'AI agent data refreshed successfully',
      summary
    });

  } catch (error) {
    console.error('AI refresh error:', error);
    
    return NextResponse.json({
      error: 'Failed to refresh AI data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
