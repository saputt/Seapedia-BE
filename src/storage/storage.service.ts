import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';

export type StorageBucket = 'profiles' | 'products';

@Injectable()
export class StorageService implements OnModuleInit {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }

    this.supabase = createClient(url, key, {
      auth: { persistSession: false },
    });
  }

  private async convertToWebP(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer).webp({ quality: 80 }).toBuffer();
  }

  async uploadImage(
    file: Express.Multer.File,
    bucket: StorageBucket,
    folder: string,
  ): Promise<string> {
    const timestamp = Date.now();
    const fileName = `${folder}/${timestamp}-${Math.random().toString(36).slice(2)}.webp`;

    const webpBuffer = await this.convertToWebP(file.buffer);

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(fileName, webpBuffer, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (error) throw error;

    const { data: publicUrlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }

  async deleteImage(bucket: StorageBucket, path: string): Promise<void> {
    const { error } = await this.supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  }

  getPublicUrl(bucket: StorageBucket, path: string): string {
    const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}
