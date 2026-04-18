import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { supabase } from '@/lib/supabase';
import { getR2Config } from '@/lib/r2';

type FileRow = {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string | null;
  file_path: string;
  storage_path: string | null;
  bucket_id: string | null;
  created_at: string;
};

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^\w.\-() ]+/g, '_');
}

function resolveStorageParts(
  storagePath: string | null,
  bucketId: string | null,
  fallbackBucket: string
) {
  const rawStoragePath = (storagePath || '').trim();
  if (rawStoragePath.includes('/')) {
    const [bucket, ...keyParts] = rawStoragePath.split('/');
    const key = keyParts.join('/');
    return {
      bucket: bucket || bucketId || fallbackBucket,
      key,
    };
  }

  return {
    bucket: bucketId || fallbackBucket,
    key: rawStoragePath,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { client, bucketName } = getR2Config();
    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action');
    const bucket = searchParams.get('bucket') || bucketName;
    const id = searchParams.get('id');

    if (action === 'list-buckets') {
      return NextResponse.json({
        buckets: [
          {
            id: bucketName,
            name: bucketName,
            created_at: null,
          },
        ],
      });
    }

    if (action === 'download-url') {
      if (!id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 });
      }

      const { data: file, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', id)
        .single<FileRow>();

      if (error || !file) {
        return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 });
      }

      const { bucket: resolvedBucket, key } = resolveStorageParts(
        file.storage_path,
        file.bucket_id,
        bucketName
      );

      if (!key) {
        return NextResponse.json(
          { error: 'storage_path file tidak valid' },
          { status: 400 }
        );
      }

      const signedUrl = await getSignedUrl(
        client,
        new GetObjectCommand({
          Bucket: resolvedBucket,
          Key: key,
          ResponseContentDisposition: `inline; filename="${file.file_name}"`,
        }),
        { expiresIn: 600 }
      );

      return NextResponse.json({
        url: signedUrl,
        expires_in: 600,
      });
    }

    const { data: files, error } = await supabase
      .from('files')
      .select('*')
      .eq('bucket_id', bucket)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ files: files || [] });
  } catch (error) {
    console.error('FILES GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { client, bucketName, publicBaseUrl } = getR2Config();
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = (await req.json()) as { action?: string; name?: string };

      if (body.action === 'create-bucket') {
        if (!body.name?.trim()) {
          return NextResponse.json({ error: 'Nama bucket wajib diisi' }, { status: 400 });
        }

        if (body.name !== bucketName) {
          return NextResponse.json(
            {
              error: `Mode R2 saat ini menggunakan bucket tetap "${bucketName}". Ubah R2_BUCKET_NAME untuk ganti bucket.`,
            },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          bucket: { id: bucketName, name: bucketName },
        });
      }
    }

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const requestedBucket = formData.get('bucket') as string | null;
      const targetBucket = requestedBucket?.trim() || bucketName;

      if (!file) {
        return NextResponse.json({ error: 'Missing file' }, { status: 400 });
      }

      if (targetBucket !== bucketName) {
        return NextResponse.json(
          {
            error: `Bucket "${targetBucket}" tidak tersedia. Bucket aktif: "${bucketName}"`,
          },
          { status: 400 }
        );
      }

      const safeFileName = sanitizeFileName(file.name);
      const objectKey = `${Date.now()}_${safeFileName}`;
      const body = Buffer.from(await file.arrayBuffer());

      await client.send(
        new PutObjectCommand({
          Bucket: targetBucket,
          Key: objectKey,
          Body: body,
          ContentType: file.type || 'application/octet-stream',
        })
      );

      const filePath = publicBaseUrl ? `${publicBaseUrl}/${objectKey}` : objectKey;

      const { data: fileData, error: metaError } = await supabase
        .from('files')
        .insert({
          file_name: file.name,
          file_size: file.size,
          file_type: file.type || null,
          file_path: filePath,
          storage_path: `${targetBucket}/${objectKey}`,
          bucket_id: targetBucket,
        })
        .select()
        .single();

      if (metaError) throw metaError;

      return NextResponse.json({ success: true, file: fileData });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('FILES POST Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { client, bucketName } = getR2Config();
    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action');
    const bucket = searchParams.get('bucket');
    const id = searchParams.get('id');
    const storagePathParam = searchParams.get('storage_path');

    if (action === 'delete-bucket' && bucket) {
      return NextResponse.json(
        {
          error: `Delete bucket via aplikasi dinonaktifkan. Bucket aktif R2: "${bucketName}"`,
        },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    let storagePath = storagePathParam || '';
    let fileBucketId: string | null = null;

    if (!storagePath) {
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('storage_path, bucket_id')
        .eq('id', id)
        .single<{ storage_path: string | null; bucket_id: string | null }>();

      if (fileError) throw fileError;
      storagePath = fileData?.storage_path || '';
      fileBucketId = fileData?.bucket_id || null;
    }

    const { bucket: resolvedBucket, key } = resolveStorageParts(
      storagePath,
      fileBucketId,
      bucketName
    );

    if (key) {
      try {
        await client.send(
          new DeleteObjectCommand({
            Bucket: resolvedBucket,
            Key: key,
          })
        );
      } catch (error) {
        console.warn('R2 delete object warning:', error);
      }
    }

    const { error: metaDeleteError } = await supabase.from('files').delete().eq('id', id);
    if (metaDeleteError) throw metaDeleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('FILES DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

