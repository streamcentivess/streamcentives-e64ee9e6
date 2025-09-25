// Shared utility for handling TypeScript error types in edge functions
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

export function createErrorResponse(error: unknown, status = 500, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ 
    success: false, 
    error: getErrorMessage(error) 
  }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}