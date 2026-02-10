/**
 * 错误处理工具
 */

export interface ErrorInfo {
  message: string
  stack?: string
  timestamp: string
  context?: Record<string, any>
}

export interface ErrorHandlerOptions {
  level: 'error' | 'warning' | 'info'
  context?: string
  silent?: boolean
}

/**
 * 格式化错误信息
 */
export function formatError(error: unknown): ErrorInfo {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }
  }
  
  return {
    message: String(error),
    timestamp: new Date().toISOString()
  }
}

/**
 * 错误处理函数
 */
export function handleError(error: unknown, options: ErrorHandlerOptions): ErrorInfo {
  const errorInfo = formatError(error)
  
  // 添加上下文信息
  errorInfo.context = {
    level: options.level,
    context: options.context
  }
  
  // 根据错误级别处理
  if (options.level === 'error' && !options.silent) {
    console.error('[Error]', errorInfo)
    
    // 可以在这里添加上报逻辑
    reportError(errorInfo)
  } else if (options.level === 'warning') {
    console.warn('[Warning]', errorInfo)
  } else {
    console.log('[Info]', errorInfo)
  }
  
  return errorInfo
}

/**
 * 错误上报（可扩展）
 */
function reportError(errorInfo: ErrorInfo): void {
  // TODO: 可以集成到 Sentry、Bugsnag 等监控平台
  console.log('[Error Reported]', errorInfo)
}

/**
 * 安全的异步函数包装
 */
export function safeAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  options?: ErrorHandlerOptions
): Promise<T> {
  return fn().catch(error => {
    handleError(error, options || { level: 'error' })
    return fallback
  })
}

/**
 * 创建带超时的 Promise
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ])
}
