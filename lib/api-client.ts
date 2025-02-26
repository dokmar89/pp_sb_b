import { toast } from "sonner"

interface ApiError {
  error: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export async function handleApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const error = (await response.json()) as ApiError
    throw new Error(error.error || "Došlo k chybě při komunikaci se serverem")
  }

  const data = await response.json()
  return { success: true, data }
}

export async function handleApiError(error: unknown): Promise<ApiResponse<never>> {
  console.error("API Error:", error)

  const errorMessage = error instanceof Error ? error.message : "Došlo k neočekávané chybě"
  toast.error(errorMessage)

  return {
    success: false,
    error: errorMessage,
  }
}

export async function verifyAge(method: string, shopId: string, data?: FormData): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`/api/verify/${method}`, {
      method: "POST",
      body: data || JSON.stringify({ shop_id: shopId }),
      headers: data
        ? undefined
        : {
            "Content-Type": "application/json",
          },
    })

    return await handleApiResponse(response)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function checkVerificationStatus(verificationId: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`/api/verify/status?verification_id=${verificationId}`)
    return await handleApiResponse(response)
  } catch (error) {
    return handleApiError(error)
  }
}

