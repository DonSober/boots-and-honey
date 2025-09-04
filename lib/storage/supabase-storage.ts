/**
 * Supabase Storage Service
 * 
 * Handles file upload, storage, and retrieval using Supabase Storage
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

export interface UploadResult {
  success: boolean
  fileUrl?: string
  filePath?: string
  error?: string
  metadata?: {
    fileSize: number
    uploadTime: number
  }
}

export interface FileInfo {
  name: string
  size: number
  lastModified: string
  publicUrl: string
}

export class SupabaseStorageService {
  private supabase: ReturnType<typeof createClient> | null = null
  private bucket: string | null = null

  constructor() {
    // Initialize lazily to avoid environment issues during module loading
  }

  private getSupabase() {
    if (!this.supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase credentials for storage service')
      }

      this.supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })

      this.bucket = process.env.SUPABASE_STORAGE_BUCKET || 'order-documents'
    }

    return this.supabase
  }

  private getBucket(): string {
    if (!this.bucket) {
      this.getSupabase() // This will initialize both supabase and bucket
    }
    return this.bucket!
  }

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    filePath: string, 
    fileName: string, 
    folder: string = 'documents'
  ): Promise<UploadResult> {
    const startTime = Date.now()

    try {
      // Read file
      const fileBuffer = fs.readFileSync(filePath)
      const fileSize = fileBuffer.length

      // Generate storage path
      const storagePath = `${folder}/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await this.getSupabase().storage
        .from(this.getBucket())
        .upload(storagePath, fileBuffer, {
          contentType: 'application/pdf',
          upsert: false
        })

      if (error) {
        return {
          success: false,
          error: `Upload failed: ${error.message}`
        }
      }

      // Get public URL
      const { data: publicUrlData } = this.getSupabase().storage
        .from(this.getBucket())
        .getPublicUrl(storagePath)

      const uploadTime = Date.now() - startTime

      return {
        success: true,
        fileUrl: publicUrlData.publicUrl,
        filePath: storagePath,
        metadata: {
          fileSize,
          uploadTime
        }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      }
    }
  }

  /**
   * Upload file from buffer (useful for in-memory PDFs)
   */
  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    folder: string = 'documents',
    contentType: string = 'application/pdf'
  ): Promise<UploadResult> {
    const startTime = Date.now()

    try {
      const fileSize = buffer.length

      // Generate storage path
      const storagePath = `${folder}/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await this.getSupabase().storage
        .from(this.getBucket())
        .upload(storagePath, buffer, {
          contentType,
          upsert: false
        })

      if (error) {
        return {
          success: false,
          error: `Upload failed: ${error.message}`
        }
      }

      // Get public URL
      const { data: publicUrlData } = this.getSupabase().storage
        .from(this.getBucket())
        .getPublicUrl(storagePath)

      const uploadTime = Date.now() - startTime

      return {
        success: true,
        fileUrl: publicUrlData.publicUrl,
        filePath: storagePath,
        metadata: {
          fileSize,
          uploadTime
        }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      }
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.getSupabase().storage
        .from(this.getBucket())
        .remove([filePath])

      if (error) {
        return {
          success: false,
          error: `Delete failed: ${error.message}`
        }
      }

      return { success: true }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown delete error'
      }
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(filePath: string): Promise<FileInfo | null> {
    try {
      const { data, error } = await this.getSupabase().storage
        .from(this.getBucket())
        .list(path.dirname(filePath), {
          search: path.basename(filePath)
        })

      if (error || !data?.length) {
        return null
      }

      const file = data[0]
      const { data: publicUrlData } = this.getSupabase().storage
        .from(this.getBucket())
        .getPublicUrl(filePath)

      return {
        name: file.name,
        size: file.metadata?.size || 0,
        lastModified: file.updated_at,
        publicUrl: publicUrlData.publicUrl
      }

    } catch {
      return null
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(folder: string = 'documents'): Promise<FileInfo[]> {
    try {
      const { data, error } = await this.getSupabase().storage
        .from(this.getBucket())
        .list(folder)

      if (error || !data) {
        return []
      }

      return data.map(file => {
        const filePath = `${folder}/${file.name}`
        const { data: publicUrlData } = this.getSupabase().storage
          .from(this.getBucket())
          .getPublicUrl(filePath)

        return {
          name: file.name,
          size: file.metadata?.size || 0,
          lastModified: file.updated_at,
          publicUrl: publicUrlData.publicUrl
        }
      })

    } catch {
      return []
    }
  }

  /**
   * Clean up old files (for maintenance)
   */
  async cleanupOldFiles(folder: string = 'documents', maxAgeHours: number = 168): Promise<number> {
    const cutoffTime = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000))
    let cleanedCount = 0

    try {
      const files = await this.listFiles(folder)
      const filesToDelete: string[] = []

      for (const file of files) {
        const fileDate = new Date(file.lastModified)
        if (fileDate < cutoffTime) {
          filesToDelete.push(`${folder}/${file.name}`)
        }
      }

      if (filesToDelete.length > 0) {
        const { error } = await this.getSupabase().storage
          .from(this.getBucket())
          .remove(filesToDelete)

        if (!error) {
          cleanedCount = filesToDelete.length
        }
      }

    } catch (error) {
      // Error cleaning up old files - ignore and continue
    }

    return cleanedCount
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(folder: string = 'documents'): Promise<{
    totalFiles: number;
    totalSize: number;
    oldestFile?: { name: string; age: number };
    newestFile?: { name: string; age: number };
  }> {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      oldestFile: undefined as { name: string; age: number } | undefined,
      newestFile: undefined as { name: string; age: number } | undefined
    }

    try {
      const files = await this.listFiles(folder)
      stats.totalFiles = files.length

      let oldestTime = Date.now()
      let newestTime = 0

      for (const file of files) {
        stats.totalSize += file.size

        const fileTime = new Date(file.lastModified).getTime()

        if (fileTime < oldestTime) {
          oldestTime = fileTime
          stats.oldestFile = {
            name: file.name,
            age: Math.floor((Date.now() - fileTime) / 1000 / 60 / 60) // hours
          }
        }

        if (fileTime > newestTime) {
          newestTime = fileTime
          stats.newestFile = {
            name: file.name,
            age: Math.floor((Date.now() - fileTime) / 1000 / 60 / 60) // hours
          }
        }
      }

    } catch (error) {
      // Error getting storage stats - return default values
    }

    return stats
  }

  /**
   * Ensure bucket exists (for setup)
   */
  async ensureBucket(): Promise<{ success: boolean; error?: string }> {
    try {
      // Try to get bucket info
      const { data, error } = await this.getSupabase().storage.getBucket(this.getBucket())

      if (error && error.message.includes('not found')) {
        // Create bucket if it doesn't exist
        const { error: createError } = await this.getSupabase().storage.createBucket(this.getBucket(), {
          public: true,
          allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg'],
          fileSizeLimit: 10485760 // 10MB
        })

        if (createError) {
          return {
            success: false,
            error: `Failed to create bucket: ${createError.message}`
          }
        }

        return { success: true }
      }

      if (error) {
        return {
          success: false,
          error: `Bucket check failed: ${error.message}`
        }
      }

      return { success: true }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown bucket error'
      }
    }
  }
}

// Export singleton for easy use
export const storageService = new SupabaseStorageService()