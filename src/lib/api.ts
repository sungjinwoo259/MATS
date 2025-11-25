/**
 * MATS Backend API Client
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface UploadResponse {
  apk_id: string
  filename: string
  size: number
  message: string
}

export interface AnalysisRequest {
  apk_id: string
  tools: string[]
}

export interface AnalysisStatus {
  apk_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  current_tool?: string | null
  results?: Record<string, any>
  error?: string | null
}

export interface HealthCheck {
  status: string
  tools: Record<string, boolean>
}

/**
 * Upload APK file to backend
 */
export async function uploadAPK(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      let errorMessage = 'Upload failed'
      try {
        const error = await response.json()
        errorMessage = error.detail || error.message || errorMessage
      } catch {
        errorMessage = `Server returned ${response.status}: ${response.statusText}`
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to backend at ${API_BASE}. Make sure the backend is running: python backend/main.py`
      )
    }
    throw error
  }
}

/**
 * Start analysis workflow
 */
export async function startAnalysis(apkId: string, tools: string[]): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apk_id: apkId,
        tools,
      }),
    })

    if (!response.ok) {
      let errorMessage = 'Analysis failed to start'
      try {
        const error = await response.json()
        errorMessage = error.detail || error.message || errorMessage
      } catch {
        errorMessage = `Server returned ${response.status}: ${response.statusText}`
      }
      throw new Error(errorMessage)
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to backend at ${API_BASE}. Make sure the backend is running: python backend/main.py`
      )
    }
    throw error
  }
}

/**
 * Get analysis status
 */
export async function getAnalysisStatus(apkId: string): Promise<AnalysisStatus> {
  try {
    const response = await fetch(`${API_BASE}/status/${apkId}`)

    if (!response.ok) {
      let errorMessage = 'Failed to get status'
      try {
        const error = await response.json()
        errorMessage = error.detail || error.message || errorMessage
      } catch {
        errorMessage = `Server returned ${response.status}: ${response.statusText}`
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to backend at ${API_BASE}. Make sure the backend is running: python backend/main.py`
      )
    }
    throw error
  }
}

/**
 * Get analysis results
 */
export async function getAnalysisResults(apkId: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}/results/${apkId}`)

    if (!response.ok) {
      let errorMessage = 'Failed to get results'
      try {
        const error = await response.json()
        errorMessage = error.detail || error.message || errorMessage
      } catch {
        errorMessage = `Server returned ${response.status}: ${response.statusText}`
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to backend at ${API_BASE}. Make sure the backend is running: python backend/main.py`
      )
    }
    throw error
  }
}

/**
 * Check API health and tool availability
 */
export async function checkHealth(): Promise<HealthCheck> {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(15000), // allow slower tool runs before timing out
    })
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`)
    }
    return response.json()
  } catch (error) {
    // Handle timeout/abort errors (DOMException with name "TimeoutError" or "AbortError")
    if (error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new Error(
        `Backend not reachable at ${API_BASE} (timeout). Start it with: python backend/main.py`
      )
    }
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Backend not reachable at ${API_BASE}. Start it with: python backend/main.py`
      )
    }
    throw error
  }
}

