import { NextRequest, NextResponse } from 'next/server';

// Global error handler middleware
export function withErrorHandler(handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      console.error('API Error:', error);
      
      // Handle different types of errors
      if (error instanceof Error) {
        // Validation errors
        if (error.name === 'ZodError') {
          return NextResponse.json(
            { 
              error: 'Validation failed', 
              details: (error as any).errors || error.message 
            },
            { status: 400 }
          );
        }
        
        // Prisma errors
        if (error.name === 'PrismaClientKnownRequestError') {
          const prismaError = error as any;
          
          // Unique constraint violation
          if (prismaError.code === 'P2002') {
            return NextResponse.json(
              { 
                error: 'Duplicate entry', 
                field: prismaError.meta?.target 
              },
              { status: 409 }
            );
          }
          
          // Record not found
          if (prismaError.code === 'P2025') {
            return NextResponse.json(
              { error: 'Resource not found' },
              { status: 404 }
            );
          }
          
          // Foreign key constraint
          if (prismaError.code === 'P2003') {
            return NextResponse.json(
              { error: 'Referenced resource not found' },
              { status: 400 }
            );
          }
        }
        
        // Generic error
        return NextResponse.json(
          { error: error.message || 'An unexpected error occurred' },
          { status: 500 }
        );
      }
      
      // Unknown error
      return NextResponse.json(
        { error: 'An unexpected error occurred' },
        { status: 500 }
      );
    }
  };
}

// Request validation middleware
export function withValidation<T>(schema: any, handler: (req: NextRequest, data: T, ...args: any[]) => Promise<NextResponse>) {
  return withErrorHandler(async (req: NextRequest, ...args: any[]) => {
    let body;
    
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: result.error.errors 
        },
        { status: 400 }
      );
    }
    
    return await handler(req, result.data, ...args);
  });
}

// Query parameter validation middleware
export function withQueryValidation<T>(schema: any, handler: (req: NextRequest, query: T, ...args: any[]) => Promise<NextResponse>) {
  return withErrorHandler(async (req: NextRequest, ...args: any[]) => {
    const { searchParams } = new URL(req.url);
    const queryObject = Object.fromEntries(searchParams.entries());
    
    const result = schema.safeParse(queryObject);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters', 
          details: result.error.errors 
        },
        { status: 400 }
      );
    }
    
    return await handler(req, result.data, ...args);
  });
}

// Rate limiting middleware (simple in-memory implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(
  limit: number = 100, 
  windowMs: number = 60000, // 1 minute
  keyGenerator: (req: NextRequest) => string = (req) => req.ip || 'unknown'
) {
  return withErrorHandler(async (req: NextRequest, ...args: any[]) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [k, data] of rateLimitStore.entries()) {
      if (data.resetTime < windowStart) {
        rateLimitStore.delete(k);
      }
    }
    
    const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (current.count >= limit) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
    
    current.count++;
    rateLimitStore.set(key, current);
    
    // Add rate limit headers
    const response = await args[0](req, ...args.slice(1));
    if (response instanceof NextResponse) {
      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', Math.max(0, limit - current.count).toString());
      response.headers.set('X-RateLimit-Reset', current.resetTime.toString());
    }
    
    return response;
  });
}

// CORS middleware
export function withCors(handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>) {
  return async (req: NextRequest, ...args: any[]) => {
    const response = await handler(req, ...args);
    
    if (response instanceof NextResponse) {
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return new NextResponse(null, { status: 200 });
      }
    }
    
    return response;
  };
}

// Authentication middleware (placeholder for future implementation)
export function withAuth(handler: (req: NextRequest, user: any, ...args: any[]) => Promise<NextResponse>) {
  return withErrorHandler(async (req: NextRequest, ...args: any[]) => {
    // For now, return a mock user
    // In a real implementation, this would validate JWT tokens or session cookies
    const user = {
      id: 'default-user-id',
      email: 'user@example.com',
      name: 'Default User',
    };
    
    return await handler(req, user, ...args);
  });
}